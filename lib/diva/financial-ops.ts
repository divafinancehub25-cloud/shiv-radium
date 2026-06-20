"use server";
/**
 * Financial Operations Logger — immutable audit trail for all withdrawal &
 * balance-affecting actions (Phase 5). Records are never updated or deleted.
 */
import { prisma } from "@/lib/prisma";
import type { DivaFinancialOpsAction } from "@prisma/client";

export async function writeFinancialOpsLog({
  actionType,
  referenceId,
  userId,
  performedBy,
  ipAddress,
  metadata,
}: {
  actionType: DivaFinancialOpsAction;
  referenceId?: string;
  userId?: string;
  performedBy?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.divaFinancialOpsLog.create({
      data: { actionType, referenceId, userId, performedBy, ipAddress, metadata: metadata as any },
    });
  } catch {
    // ops-log failures must never crash the underlying financial operation
  }
}
