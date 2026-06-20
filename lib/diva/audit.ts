"use server";
import { prisma } from "@/lib/prisma";
import type { DivaAuditAction } from "@prisma/client";

export async function writeAuditLog({
  action,
  entityType,
  entityId,
  performedBy,
  ipAddress,
  userAgent,
  metadata,
}: {
  action: DivaAuditAction;
  entityType: string;
  entityId?: string;
  performedBy?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.divaAuditLog.create({
      data: { action, entityType, entityId, performedBy, ipAddress, userAgent, metadata: metadata as any },
    });
  } catch {
    // audit log failures must not crash the main operation
  }
}
