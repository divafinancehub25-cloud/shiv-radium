"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { DivaAlertSeverity } from "@prisma/client";

export async function getAlerts(status?: "OPEN" | "ACKNOWLEDGED" | "RESOLVED", page = 1) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const limit = 30;
  const where = status ? { status } : {};

  const [items, total, openCount, criticalCount] = await Promise.all([
    prisma.divaSystemAlert.findMany({
      where,
      include: { assignee: { select: { name: true } } },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.divaSystemAlert.count({ where }),
    prisma.divaSystemAlert.count({ where: { status: "OPEN" } }),
    prisma.divaSystemAlert.count({ where: { status: "OPEN", severity: "CRITICAL" } }),
  ]);

  return {
    data: items.map((a) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      severity: a.severity,
      status: a.status,
      alertType: a.alertType,
      createdAt: a.createdAt.toISOString(),
      assigneeName: a.assignee?.name ?? null,
    })),
    total, openCount, criticalCount,
    pages: Math.ceil(total / limit),
  };
}

export async function acknowledgeAlert(id: string): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.divaSystemAlert.update({
    where: { id },
    data: { status: "ACKNOWLEDGED", acknowledgedBy: session.user.id, acknowledgedAt: new Date() },
  });

  revalidatePath("/diva-app-admin/analytics/alerts");
  return { success: true };
}

export async function resolveAlert(id: string): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.divaSystemAlert.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });

  revalidatePath("/diva-app-admin/analytics/alerts");
  return { success: true };
}

export async function createAlert(data: {
  title: string; message: string; severity: DivaAlertSeverity;
  alertType: string; entityType?: string; entityId?: string;
}): Promise<{ success?: boolean; error?: string }> {
  await prisma.divaSystemAlert.create({ data });
  return { success: true };
}

export async function autoDetectAlerts(): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const checks = [
    {
      check: () => prisma.divaWithdrawal.count({ where: { status: "PENDING" } }),
      threshold: 10,
      title: "High Pending Withdrawals",
      message: (n: number) => `${n} withdrawals pending approval`,
      severity: "WARNING" as DivaAlertSeverity,
      alertType: "WITHDRAWAL_BACKLOG",
    },
    {
      check: () => prisma.divaKYCSubmission.count({ where: { status: "UNDER_REVIEW" } }),
      threshold: 5,
      title: "KYC Review Backlog",
      message: (n: number) => `${n} KYC submissions awaiting review`,
      severity: "WARNING" as DivaAlertSeverity,
      alertType: "KYC_BACKLOG",
    },
    {
      check: () => prisma.divaLoginHistory.count({ where: { status: "FAILED", createdAt: { gte: new Date(Date.now() - 3600000) } } }),
      threshold: 20,
      title: "High Failed Login Rate",
      message: (n: number) => `${n} failed login attempts in last hour`,
      severity: "CRITICAL" as DivaAlertSeverity,
      alertType: "SECURITY_LOGIN_FAILURES",
    },
  ];

  for (const c of checks) {
    const count = await c.check();
    if (count >= c.threshold) {
      const existing = await prisma.divaSystemAlert.findFirst({
        where: { alertType: c.alertType, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
      });
      if (!existing) {
        await prisma.divaSystemAlert.create({
          data: { title: c.title, message: c.message(count), severity: c.severity, alertType: c.alertType },
        });
      }
    }
  }

  revalidatePath("/diva-app-admin/analytics/alerts");
  return { success: true };
}
