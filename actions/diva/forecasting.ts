"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createScenarioSchema, updateScenarioSchema, createMilestoneSchema, updateMilestoneSchema } from "@/lib/diva/validators/forecasting";
import { calcForecast } from "@/lib/diva/forecast-engine";
import type { ForecastInput } from "@/types/diva/forecasting";

// ─── Scenarios ────────────────────────────────────────────────────────────────

export async function getUserScenarios() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const scenarios = await prisma.divaForecastScenario.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    include: { results: { orderBy: { generatedAt: "desc" }, take: 1 } },
  });
  return { scenarios };
}

export async function createScenario(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = createScenarioSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const input: ForecastInput = {
    initialAmount: d.initialAmount,
    contributionAmount: d.contributionAmount,
    contributionFreq: d.contributionFreq,
    durationYears: d.durationYears,
    growthRate: d.growthRate,
    compoundingFreq: d.compoundingFreq,
  };
  const result = calcForecast(input);

  const scenario = await prisma.divaForecastScenario.create({
    data: {
      userId: session.user.id,
      scenarioName: d.scenarioName,
      initialAmount: d.initialAmount,
      contributionAmount: d.contributionAmount,
      contributionFreq: d.contributionFreq,
      durationYears: d.durationYears,
      growthRate: d.growthRate,
      compoundingFreq: d.compoundingFreq,
      color: d.color ?? "#D4AF37",
      results: {
        create: {
          projectedValue: result.projectedValue,
          totalContribs: result.totalContributions,
          estimatedGrowth: result.estimatedGrowth,
          dataPoints: result.dataPoints as any,
        },
      },
    },
    include: { results: true },
  });

  revalidatePath("/diva-app/forecasting/scenarios");
  return { scenario };
}

export async function updateScenario(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = updateScenarioSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, ...rest } = parsed.data;

  const existing = await prisma.divaForecastScenario.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return { error: "Scenario not found" };

  const updated = await prisma.divaForecastScenario.update({
    where: { id },
    data: rest,
  });

  // Recompute result if financial params changed
  if (rest.initialAmount !== undefined || rest.growthRate !== undefined || rest.durationYears !== undefined) {
    const cur = { ...existing, ...rest };
    const input: ForecastInput = {
      initialAmount: Number(cur.initialAmount),
      contributionAmount: Number(cur.contributionAmount),
      contributionFreq: cur.contributionFreq as any,
      durationYears: cur.durationYears,
      growthRate: Number(cur.growthRate),
      compoundingFreq: cur.compoundingFreq as any,
    };
    const result = calcForecast(input);
    await prisma.divaForecastResult.create({
      data: {
        scenarioId: id,
        projectedValue: result.projectedValue,
        totalContribs: result.totalContributions,
        estimatedGrowth: result.estimatedGrowth,
        dataPoints: result.dataPoints as any,
      },
    });
  }

  revalidatePath("/diva-app/forecasting/scenarios");
  return { scenario: updated };
}

export async function deleteScenario(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const existing = await prisma.divaForecastScenario.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return { error: "Not found" };

  await prisma.divaForecastScenario.delete({ where: { id } });
  revalidatePath("/diva-app/forecasting/scenarios");
  return { success: true };
}

export async function duplicateScenario(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const original = await prisma.divaForecastScenario.findFirst({ where: { id, userId: session.user.id } });
  if (!original) return { error: "Not found" };

  const result = await createScenario({
    scenarioName: `${original.scenarioName} (copy)`,
    initialAmount: Number(original.initialAmount),
    contributionAmount: Number(original.contributionAmount),
    contributionFreq: original.contributionFreq,
    durationYears: original.durationYears,
    growthRate: Number(original.growthRate),
    compoundingFreq: original.compoundingFreq,
    color: original.color,
  });
  return result;
}

export async function togglePinScenario(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const existing = await prisma.divaForecastScenario.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return { error: "Not found" };

  const updated = await prisma.divaForecastScenario.update({ where: { id }, data: { isPinned: !existing.isPinned } });
  revalidatePath("/diva-app/forecasting/scenarios");
  return { scenario: updated };
}

// ─── Milestones ───────────────────────────────────────────────────────────────

export async function getUserMilestones() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const milestones = await prisma.divaUserMilestone.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return { milestones };
}

export async function createMilestone(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = createMilestoneSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const milestone = await prisma.divaUserMilestone.create({
    data: {
      userId: session.user.id,
      milestoneName: d.milestoneName,
      targetAmount: d.targetAmount,
      targetDate: d.targetDate ? new Date(d.targetDate) : null,
      notes: d.notes,
    },
  });

  revalidatePath("/diva-app/forecasting/milestones");
  return { milestone };
}

export async function updateMilestone(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = updateMilestoneSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, targetDate, ...rest } = parsed.data;
  const existing = await prisma.divaUserMilestone.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return { error: "Not found" };

  const milestone = await prisma.divaUserMilestone.update({
    where: { id },
    data: { ...rest, targetDate: targetDate ? new Date(targetDate) : undefined },
  });

  revalidatePath("/diva-app/forecasting/milestones");
  return { milestone };
}

export async function deleteMilestone(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const existing = await prisma.divaUserMilestone.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return { error: "Not found" };

  await prisma.divaUserMilestone.delete({ where: { id } });
  revalidatePath("/diva-app/forecasting/milestones");
  return { success: true };
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getUserHistoricalData(range: "7d" | "30d" | "90d" | "1y" | "all" = "30d") {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const days: Record<string, number | null> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365, all: null };
  const d = days[range];
  const since = d ? new Date(Date.now() - d * 24 * 60 * 60 * 1000) : new Date(0);

  const entries = await prisma.divaLedgerEntry.findMany({
    where: { userId: session.user.id, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true, newBalance: true, transactionType: true, amount: true },
  });

  // Build daily map
  const map = new Map<string, { balance: number; deposits: number; adjustments: number }>();
  for (const e of entries) {
    const day = e.createdAt.toISOString().slice(0, 10);
    const prev = map.get(day) ?? { balance: 0, deposits: 0, adjustments: 0 };
    const amt = Math.abs(Number(e.amount));
    if (e.transactionType === "DEPOSIT_CREDIT") prev.deposits += amt;
    else prev.adjustments += amt;
    prev.balance = Number(e.newBalance);
    map.set(day, prev);
  }

  return { points: Array.from(map.entries()).map(([date, v]) => ({ date, ...v })) };
}

export async function getUserInsights() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const [portfolio, recentLedger, depositCount, scenarioCount] = await Promise.all([
    prisma.divaPortfolio.findUnique({ where: { userId: session.user.id } }),
    prisma.divaLedgerEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { amount: true, transactionType: true, createdAt: true },
    }),
    prisma.divaDeposit.count({ where: { userId: session.user.id, status: "APPROVED" } }),
    prisma.divaForecastScenario.count({ where: { userId: session.user.id } }),
  ]);

  const totalDeposited = recentLedger.filter(e => e.transactionType === "DEPOSIT_CREDIT").reduce((a, e) => a + Math.abs(Number(e.amount)), 0);
  const last30Days = recentLedger.filter(e => e.createdAt > new Date(Date.now() - 30 * 86400000));
  const last30Deposited = last30Days.filter(e => e.transactionType === "DEPOSIT_CREDIT").reduce((a, e) => a + Math.abs(Number(e.amount)), 0);

  return {
    balance: Number(portfolio?.currentBalance ?? 0),
    totalDeposited,
    last30Deposited,
    depositCount,
    scenarioCount,
    portfolioStatus: portfolio?.status ?? "ACTIVE",
  };
}

// ─── Admin analytics ──────────────────────────────────────────────────────────

export async function adminForecastStats() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) return { error: "Unauthorized" };

  const [totalScenarios, totalMilestones, usersWithScenarios, avgRate, topScenarios, milestoneByStatus] = await Promise.all([
    prisma.divaForecastScenario.count(),
    prisma.divaUserMilestone.count(),
    prisma.divaForecastScenario.groupBy({ by: ["userId"], _count: { id: true } }),
    prisma.divaForecastScenario.aggregate({ _avg: { growthRate: true } }),
    prisma.divaForecastScenario.groupBy({ by: ["scenarioName"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 5 }),
    prisma.divaUserMilestone.groupBy({ by: ["status"], _count: { id: true } }),
  ]);

  return {
    totalScenarios,
    totalMilestones,
    activeUsers: usersWithScenarios.length,
    avgGrowthRate: Number(avgRate._avg.growthRate ?? 0),
    topScenarios: topScenarios.map(s => ({ scenarioName: s.scenarioName, count: s._count.id })),
    milestoneByStatus: milestoneByStatus.map(m => ({ status: m.status, count: m._count.id })),
  };
}
