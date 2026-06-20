import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  oldValues,
  newValues,
}: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}) {
  try {
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValues: oldValues ? (oldValues as object) : undefined,
        newValues: newValues ? (newValues as object) : undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch {
    // Audit log failures should never break the main operation
  }
}
