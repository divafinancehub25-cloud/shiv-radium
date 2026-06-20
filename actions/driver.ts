"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { createDriverSchema, updateDriverSchema } from "@/lib/validators/driver";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

function requireAdmin(role: string) {
  return ["SUPER_ADMIN", "ADMIN"].includes(role);
}

export async function createDriver(formData: FormData) {
  const session = await auth();
  if (!session?.user || !requireAdmin(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const raw = Object.fromEntries(formData);
  const validated = createDriverSchema.safeParse(raw);
  if (!validated.success) return { error: validated.error.flatten().fieldErrors };

  const data = validated.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { phone: data.phone }] },
  });
  if (existing) return { error: { email: ["Email or phone already registered"] } };

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: Role.DRIVER,
      driver: {
        create: {
          licenseNo: data.licenseNo,
          licenseExp: new Date(data.licenseExp),
          address: data.address,
          city: data.city,
          notes: data.notes,
        },
      },
    },
    include: { driver: true },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entity: "Driver",
    entityId: user.driver!.id,
    newValues: { name: data.name, licenseNo: data.licenseNo },
  });

  revalidatePath("/admin/drivers");
  return { success: true, driverId: user.driver!.id };
}

export async function updateDriver(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || !requireAdmin(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const raw = Object.fromEntries(formData);
  const validated = updateDriverSchema.safeParse({
    ...raw,
    isAvailable: raw.isAvailable === "true",
  });
  if (!validated.success) return { error: validated.error.flatten().fieldErrors };

  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) return { error: "Driver not found" };

  const { name, phone, ...driverData } = validated.data;

  await prisma.$transaction([
    prisma.driver.update({
      where: { id },
      data: {
        ...(driverData.licenseNo && { licenseNo: driverData.licenseNo }),
        ...(driverData.licenseExp && { licenseExp: new Date(driverData.licenseExp) }),
        ...(driverData.isAvailable !== undefined && { isAvailable: driverData.isAvailable }),
        ...(driverData.address && { address: driverData.address }),
        ...(driverData.city && { city: driverData.city }),
        ...(driverData.notes !== undefined && { notes: driverData.notes }),
      },
    }),
    ...(name || phone
      ? [
          prisma.user.update({
            where: { id: driver.userId },
            data: {
              ...(name && { name }),
              ...(phone && { phone }),
            },
          }),
        ]
      : []),
  ]);

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "Driver",
    entityId: id,
    newValues: validated.data as Record<string, unknown>,
  });

  revalidatePath("/admin/drivers");
  revalidatePath(`/admin/drivers/${id}`);
  return { success: true };
}

export async function listDrivers(filters?: {
  isAvailable?: boolean;
  page?: number;
  limit?: number;
}) {
  const session = await auth();
  if (!session?.user || !requireAdmin(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;

  const where = {
    ...(filters?.isAvailable !== undefined && { isAvailable: filters.isAvailable }),
    user: { isActive: true },
  };

  const [drivers, total] = await Promise.all([
    prisma.driver.findMany({
      where,
      include: {
        user: true,
        driverDocs: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.driver.count({ where }),
  ]);

  return { drivers, total, page, limit };
}

export async function getAvailableDrivers() {
  const session = await auth();
  if (!session?.user || !requireAdmin(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const drivers = await prisma.driver.findMany({
    where: { isAvailable: true, user: { isActive: true } },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  return { drivers };
}
