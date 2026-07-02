"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { createVehicleSchema, updateVehicleSchema } from "@/lib/validators/vehicle";
import { VehicleStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

function requireAdmin(role: string) {
  return ["SUPER_ADMIN", "ADMIN"].includes(role);
}

export async function createVehicle(formData: FormData) {
  const session = await auth();
  if (!session?.user || !requireAdmin(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const raw = Object.fromEntries(formData);
  const validated = createVehicleSchema.safeParse({
    ...raw,
    year: Number(raw.year),
    features: raw.features ? String(raw.features).split(",").map((f) => f.trim()) : [],
  });

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const vehicle = await prisma.vehicle.create({ data: validated.data });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entity: "Vehicle",
    entityId: vehicle.id,
    newValues: { model: vehicle.model, registration: vehicle.registration },
  });

  revalidatePath("/admin/vehicles");
  return { success: true, vehicle };
}

export async function updateVehicle(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || !requireAdmin(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const raw = Object.fromEntries(formData);
  const validated = updateVehicleSchema.safeParse({
    ...raw,
    year: raw.year ? Number(raw.year) : undefined,
    features: raw.features ? String(raw.features).split(",").map((f) => f.trim()) : undefined,
    isActive: raw.isActive === "true",
  });

  if (!validated.success) return { error: validated.error.flatten().fieldErrors };

  const old = await prisma.vehicle.findUnique({ where: { id } });
  const vehicle = await prisma.vehicle.update({ where: { id }, data: validated.data });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "Vehicle",
    entityId: id,
    oldValues: old as Record<string, unknown>,
    newValues: validated.data as Record<string, unknown>,
  });

  revalidatePath("/admin/vehicles");
  revalidatePath(`/admin/vehicles/${id}`);
  return { success: true, vehicle };
}

export async function deleteVehicle(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized" };
  }

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: { isActive: false, status: VehicleStatus.RETIRED },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entity: "Vehicle",
    entityId: id,
  });

  revalidatePath("/admin/vehicles");
  return { success: true };
}

export async function listVehicles(filters?: {
  status?: VehicleStatus;
  isActive?: boolean;
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
    isActive: filters?.isActive ?? true,
    ...(filters?.status && { status: filters.status }),
  };

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      include: { documents: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.vehicle.count({ where }),
  ]);

  return { vehicles, total, page, limit };
}

export async function getAvailableVehicles() {
  const session = await auth();
  if (!session?.user || !requireAdmin(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { status: VehicleStatus.AVAILABLE, isActive: true },
    orderBy: { model: "asc" },
  });

  return { vehicles };
}
