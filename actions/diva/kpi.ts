"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { KpiCard } from "@/types/diva/analytics";

export async function getKpiCards(): Promise<{ data?: KpiCard[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const defs = await prisma.divaKpiDefinition.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      values: {
        orderBy: { periodDate: "desc" },
        take: 2,
      },
    },
  });

  const cards: KpiCard[] = defs.map((d) => {
    const current = d.values[0]?.value ?? 0;
    const previous = d.values[1]?.value ?? 0;
    const trend = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;
    const status =
      d.criticalAt != null && (d.criticalAt < (d.warningAt ?? Infinity) ? current <= d.criticalAt : current >= d.criticalAt)
        ? "critical"
        : d.warningAt != null && (d.warningAt < (d.criticalAt ?? Infinity) ? current <= d.warningAt : current >= d.warningAt)
        ? "warning"
        : "normal";

    return {
      id: d.id,
      name: d.name,
      description: d.description,
      unit: d.unit,
      currentValue: current,
      target: d.target,
      warningAt: d.warningAt,
      criticalAt: d.criticalAt,
      trend,
      status,
    };
  });

  return { data: cards };
}

export async function adminCreateKpi(data: {
  name: string;
  description?: string;
  formula: string;
  unit?: string;
  target?: number;
  warningAt?: number;
  criticalAt?: number;
}): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.divaKpiDefinition.create({
    data: { ...data, createdBy: session.user.id },
  });

  revalidatePath("/diva-app-admin/analytics/kpis");
  return { success: true };
}

export async function adminToggleKpi(id: string, isActive: boolean): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.divaKpiDefinition.update({ where: { id }, data: { isActive } });
  revalidatePath("/diva-app-admin/analytics/kpis");
  return { success: true };
}

export async function adminSeedDefaultKpis(): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const defaults = [
    { name: "Daily Active Users", description: "Users who logged in today", formula: "user_login_count_today", unit: "users", sortOrder: 1 },
    { name: "KYC Approval Rate", description: "% of KYC submissions approved", formula: "kyc_approved/kyc_total*100", unit: "%", target: 80, warningAt: 60, criticalAt: 40, sortOrder: 2 },
    { name: "Deposit Conversion Rate", description: "% of users who deposited", formula: "deposited_users/total_users*100", unit: "%", target: 30, warningAt: 15, criticalAt: 5, sortOrder: 3 },
    { name: "Referral Conversion Rate", description: "% of referrals activated", formula: "activated_referrals/total_referrals*100", unit: "%", target: 40, warningAt: 20, criticalAt: 10, sortOrder: 4 },
    { name: "Pending Withdrawals", description: "Withdrawals awaiting approval", formula: "withdrawal_pending_count", unit: "count", warningAt: 10, criticalAt: 25, sortOrder: 5 },
    { name: "Open Alerts", description: "Unresolved system alerts", formula: "alert_open_count", unit: "count", warningAt: 5, criticalAt: 15, sortOrder: 6 },
  ];

  for (const d of defaults) {
    const exists = await prisma.divaKpiDefinition.findFirst({ where: { formula: d.formula } });
    if (!exists) await prisma.divaKpiDefinition.create({ data: { ...d, createdBy: session.user.id } });
  }

  revalidatePath("/diva-app-admin/analytics/kpis");
  return { success: true };
}

export async function adminRecordKpiValues(): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const defs = await prisma.divaKpiDefinition.findMany({ where: { isActive: true } });
  const today = new Date(); today.setHours(0, 0, 0, 0);

  for (const def of defs) {
    let value = 0;
    try {
      if (def.formula === "user_login_count_today") {
        value = await prisma.divaLoginHistory.count({ where: { status: "SUCCESS", createdAt: { gte: today } } });
      } else if (def.formula === "kyc_approved/kyc_total*100") {
        const [approved, total] = await Promise.all([
          prisma.divaKYCSubmission.count({ where: { status: "APPROVED" } }),
          prisma.divaKYCSubmission.count(),
        ]);
        value = total > 0 ? Math.round((approved / total) * 100) : 0;
      } else if (def.formula === "withdrawal_pending_count") {
        value = await prisma.divaWithdrawal.count({ where: { status: "PENDING" } });
      } else if (def.formula === "alert_open_count") {
        value = await prisma.divaSystemAlert.count({ where: { status: "OPEN" } });
      } else if (def.formula === "deposited_users/total_users*100") {
        const [dep, tot] = await Promise.all([
          prisma.divaDeposit.groupBy({ by: ["userId"], where: { status: "APPROVED" } }).then((r) => r.length),
          prisma.user.count(),
        ]);
        value = tot > 0 ? Math.round((dep / tot) * 100) : 0;
      } else if (def.formula === "activated_referrals/total_referrals*100") {
        const [act, tot] = await Promise.all([
          prisma.divaReferral.count({ where: { status: "ACTIVATED" } }),
          prisma.divaReferral.count(),
        ]);
        value = tot > 0 ? Math.round((act / tot) * 100) : 0;
      }
    } catch {}

    await prisma.divaKpiValue.upsert({
      where: { kpiId_period_periodDate: { kpiId: def.id, period: "DAILY", periodDate: today } },
      update: { value },
      create: { kpiId: def.id, value, period: "DAILY", periodDate: today },
    });
  }

  return { success: true };
}

export async function adminGetAllKpis() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const defs = await prisma.divaKpiDefinition.findMany({
    orderBy: { sortOrder: "asc" },
    include: { values: { orderBy: { periodDate: "desc" }, take: 1 } },
  });

  return {
    data: defs.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      formula: d.formula,
      unit: d.unit,
      target: d.target,
      warningAt: d.warningAt,
      criticalAt: d.criticalAt,
      isActive: d.isActive,
      currentValue: d.values[0]?.value ?? null,
    })),
  };
}
