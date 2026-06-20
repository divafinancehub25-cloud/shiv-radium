"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { generateBookingNumber } from "@/lib/booking-number";
import { calculatePrice } from "@/lib/pricing";
import {
  createBookingSchema,
  updateBookingStatusSchema,
  assignVehicleSchema,
  assignDriverSchema,
} from "@/lib/validators/booking";
import { BookingStatus, PackageType, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

// ─── Status machine: allowed transitions ─────────────────────────────────────
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["VEHICLE_ASSIGNED", "CANCELLED"],
  VEHICLE_ASSIGNED: ["DRIVER_ASSIGNED", "CONFIRMED"],
  DRIVER_ASSIGNED: ["IN_PROGRESS", "VEHICLE_ASSIGNED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: ["REFUNDED"],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
};

// ─── Create booking (public + admin) ─────────────────────────────────────────
export async function createBooking(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const validated = createBookingSchema.safeParse({
    ...raw,
    estimatedKm: raw.estimatedKm ? Number(raw.estimatedKm) : undefined,
  });

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const data = validated.data;

  // Find or create customer
  let user = await prisma.user.findUnique({
    where: { email: data.customerEmail },
    include: { customer: true },
  });

  if (!user) {
    const passwordHash = await bcrypt.hash(
      data.customerPhone, // temp password = phone
      10
    );
    user = await prisma.user.create({
      data: {
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone,
        passwordHash,
        role: Role.CUSTOMER,
        customer: { create: {} },
      },
      include: { customer: true },
    });
  } else if (!user.customer) {
    await prisma.customer.create({ data: { userId: user.id } });
    user = await prisma.user.findUnique({
      where: { id: user.id },
      include: { customer: true },
    });
  }

  const customer = user!.customer!;

  // Calculate base price
  const pricing = await calculatePrice({
    packageType: data.packageType as PackageType,
    actualKm: data.estimatedKm,
  });

  const booking = await prisma.booking.create({
    data: {
      bookingNumber: generateBookingNumber(),
      customerId: customer.id,
      serviceType: data.serviceType,
      packageType: data.packageType,
      pickupCity: data.pickupCity,
      dropCity: data.dropCity,
      pickupAddress: data.pickupAddress,
      dropAddress: data.dropAddress,
      pickupDateTime: new Date(data.pickupDateTime),
      returnDateTime: data.returnDateTime
        ? new Date(data.returnDateTime)
        : undefined,
      estimatedKm: data.estimatedKm,
      specialNotes: data.specialNotes,
      baseAmount: pricing.baseAmount,
      totalAmount: pricing.totalAmount,
      balanceAmount: pricing.totalAmount,
      statusHistory: {
        create: {
          status: BookingStatus.PENDING,
          note: "Booking submitted by customer",
        },
      },
    },
  });

  await createAuditLog({
    action: "CREATE",
    entity: "Booking",
    entityId: booking.id,
    newValues: { bookingNumber: booking.bookingNumber, customerId: customer.id },
  });

  revalidatePath("/admin/bookings");
  return { success: true, bookingId: booking.id, bookingNumber: booking.bookingNumber };
}

// ─── Update booking status (admin only) ──────────────────────────────────────
export async function updateBookingStatus(input: {
  bookingId: string;
  status: string;
  note?: string;
}) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const validated = updateBookingStatusSchema.safeParse(input);
  if (!validated.success) return { error: "Invalid input" };

  const { bookingId, status, note } = validated.data;
  const newStatus = status as BookingStatus;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });
  if (!booking) return { error: "Booking not found" };

  const allowed = ALLOWED_TRANSITIONS[booking.status];
  if (!allowed.includes(newStatus)) {
    return { error: `Cannot transition from ${booking.status} to ${newStatus}` };
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: newStatus,
      statusHistory: {
        create: {
          status: newStatus,
          note,
          changedBy: session.user.id,
        },
      },
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "STATUS_UPDATE",
    entity: "Booking",
    entityId: bookingId,
    oldValues: { status: booking.status },
    newValues: { status: newStatus },
  });

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { success: true, booking: updated };
}

// ─── Assign vehicle ───────────────────────────────────────────────────────────
export async function assignVehicle(input: {
  bookingId: string;
  vehicleId: string;
}) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const validated = assignVehicleSchema.safeParse(input);
  if (!validated.success) return { error: "Invalid input" };

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: input.vehicleId },
  });
  if (!vehicle || vehicle.status !== "AVAILABLE") {
    return { error: "Vehicle is not available" };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
  });
  if (!booking) return { error: "Booking not found" };

  const [updated] = await prisma.$transaction([
    prisma.booking.update({
      where: { id: input.bookingId },
      data: {
        vehicleId: input.vehicleId,
        status: "VEHICLE_ASSIGNED",
        statusHistory: {
          create: {
            status: "VEHICLE_ASSIGNED",
            note: `Vehicle ${vehicle.registration} assigned`,
            changedBy: session.user.id,
          },
        },
      },
    }),
    prisma.vehicle.update({
      where: { id: input.vehicleId },
      data: { status: "IN_SERVICE" },
    }),
  ]);

  await createAuditLog({
    userId: session.user.id,
    action: "ASSIGN_VEHICLE",
    entity: "Booking",
    entityId: input.bookingId,
    newValues: { vehicleId: input.vehicleId, registration: vehicle.registration },
  });

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${input.bookingId}`);
  return { success: true, booking: updated };
}

// ─── Assign driver ────────────────────────────────────────────────────────────
export async function assignDriver(input: {
  bookingId: string;
  driverId: string;
}) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const validated = assignDriverSchema.safeParse(input);
  if (!validated.success) return { error: "Invalid input" };

  const driver = await prisma.driver.findUnique({
    where: { id: input.driverId },
    include: { user: true },
  });
  if (!driver || !driver.isAvailable) {
    return { error: "Driver is not available" };
  }

  const [updated] = await prisma.$transaction([
    prisma.booking.update({
      where: { id: input.bookingId },
      data: {
        driverId: input.driverId,
        status: "DRIVER_ASSIGNED",
        statusHistory: {
          create: {
            status: "DRIVER_ASSIGNED",
            note: `Driver ${driver.user.name} assigned`,
            changedBy: session.user.id,
          },
        },
      },
    }),
    prisma.driver.update({
      where: { id: input.driverId },
      data: { isAvailable: false },
    }),
  ]);

  await createAuditLog({
    userId: session.user.id,
    action: "ASSIGN_DRIVER",
    entity: "Booking",
    entityId: input.bookingId,
    newValues: { driverId: input.driverId, driverName: driver.user.name },
  });

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${input.bookingId}`);
  return { success: true, booking: updated };
}

// ─── List bookings (admin) ────────────────────────────────────────────────────
export async function listBookings(filters?: {
  status?: BookingStatus;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where = {
    ...(filters?.status && { status: filters.status }),
    ...(filters?.search && {
      OR: [
        { bookingNumber: { contains: filters.search, mode: "insensitive" as const } },
        { customer: { user: { name: { contains: filters.search, mode: "insensitive" as const } } } },
        { pickupCity: { contains: filters.search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        customer: { include: { user: true } },
        vehicle: true,
        driver: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return { bookings, total, page, limit, pages: Math.ceil(total / limit) };
}

// ─── Get single booking ───────────────────────────────────────────────────────
export async function getBooking(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: { include: { user: true } },
      vehicle: true,
      driver: { include: { user: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      payments: true,
      invoice: true,
      review: true,
    },
  });

  if (!booking) return { error: "Not found" };

  // Customers can only see their own bookings
  if (session.user.role === "CUSTOMER") {
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
    });
    if (booking.customerId !== customer?.id) return { error: "Unauthorized" };
  }

  return { booking };
}
