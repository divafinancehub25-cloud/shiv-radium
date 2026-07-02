"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type {
  ExecutiveSummary, UserGrowthData, DepositAnalyticsData,
  WithdrawalAnalyticsData, PortfolioAnalyticsData, ReferralAnalyticsData,
  TimeSeriesPoint, PeriodFilter,
} from "@/types/diva/analytics";

function since(period: PeriodFilter): Date {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
  return new Date(Date.now() - days * 86400000);
}

function dateRange(period: PeriodFilter): Date[] {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const step = days <= 30 ? 1 : days <= 90 ? 7 : 30;
  const dates: Date[] = [];
  for (let i = days; i >= 0; i -= step) {
    dates.push(new Date(Date.now() - i * 86400000));
  }
  return dates;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── Executive Summary ────────────────────────────────────────────────────────

export async function getExecutiveSummary(): Promise<{ data?: ExecutiveSummary; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [
    totalUsers, newUsersThisMonth, verifiedUsers,
    deposits, withdrawals, portfolios,
    referrals, activatedReferrals, rewards, openAlerts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.divaKYCSubmission.count({ where: { status: "APPROVED" } }),
    prisma.divaDeposit.aggregate({ _sum: { amount: true }, _count: true, where: { status: "APPROVED" } }),
    prisma.divaWithdrawal.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.divaPortfolio.findMany({ select: { currentBalance: true, status: true } }),
    prisma.divaReferral.count(),
    prisma.divaReferral.count({ where: { status: "ACTIVATED" } }),
    prisma.divaUserReward.aggregate({ _sum: { rewardValue: true }, where: { rewardType: "POINTS" } }),
    prisma.divaSystemAlert.count({ where: { status: "OPEN" } }),
  ]);

  const activePortfolios = portfolios.filter((p) => p.status === "ACTIVE").length;
  const totalPortfolioValue = portfolios.reduce((sum, p) => sum + Number(p.currentBalance), 0);

  return {
    data: {
      totalUsers,
      newUsersThisMonth,
      verifiedUsers,
      kycRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
      totalDeposits: deposits._count,
      depositVolume: Number(deposits._sum.amount ?? 0),
      totalWithdrawals: withdrawals._count,
      withdrawVolume: Number(withdrawals._sum.amount ?? 0),
      activePortfolios,
      totalPortfolioValue,
      totalReferrals: referrals,
      activatedReferrals,
      referralConversion: referrals > 0 ? Math.round((activatedReferrals / referrals) * 100) : 0,
      openAlerts,
    },
  };
}

// ─── User Analytics ───────────────────────────────────────────────────────────

export async function getUserAnalytics(period: PeriodFilter = "30d"): Promise<{ data?: UserGrowthData; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const dates = dateRange(period);
  const sinceDate = since(period);

  const series: TimeSeriesPoint[] = [];
  for (let i = 0; i < dates.length - 1; i++) {
    const count = await prisma.user.count({
      where: { createdAt: { gte: dates[i], lt: dates[i + 1] } },
    });
    series.push({ date: fmtDate(dates[i]), value: count });
  }

  const [totalUsers, newThisPeriod] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: sinceDate } } }),
  ]);

  const prevPeriodStart = new Date(sinceDate.getTime() - (Date.now() - sinceDate.getTime()));
  const prevPeriodCount = await prisma.user.count({ where: { createdAt: { gte: prevPeriodStart, lt: sinceDate } } });
  const growthRate = prevPeriodCount > 0 ? Math.round(((newThisPeriod - prevPeriodCount) / prevPeriodCount) * 100) : 0;

  return { data: { series, totalUsers, newThisPeriod, growthRate } };
}

// ─── Deposit Analytics ────────────────────────────────────────────────────────

export async function getDepositAnalytics(period: PeriodFilter = "30d"): Promise<{ data?: DepositAnalyticsData; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const dates = dateRange(period);

  const volumeSeries: TimeSeriesPoint[] = [];
  const countSeries: TimeSeriesPoint[] = [];

  for (let i = 0; i < dates.length - 1; i++) {
    const [agg] = await Promise.all([
      prisma.divaDeposit.aggregate({
        _sum: { amount: true }, _count: true,
        where: { status: "APPROVED", createdAt: { gte: dates[i], lt: dates[i + 1] } },
      }),
    ]);
    volumeSeries.push({ date: fmtDate(dates[i]), value: Number(agg._sum.amount ?? 0) });
    countSeries.push({ date: fmtDate(dates[i]), value: agg._count });
  }

  const sinceDate = since(period);
  const totals = await prisma.divaDeposit.aggregate({
    _sum: { amount: true }, _count: true,
    where: { status: "APPROVED", createdAt: { gte: sinceDate } },
  });

  const byWallet = await prisma.divaDeposit.groupBy({
    by: ["walletId"],
    where: { status: "APPROVED", createdAt: { gte: sinceDate } },
    _count: true,
    _sum: { amount: true },
  });

  const walletIds = byWallet.map((b) => b.walletId).filter(Boolean) as string[];
  const wallets = await prisma.divaDepositWallet.findMany({ where: { id: { in: walletIds } }, select: { id: true, coinType: true } });
  const walletMap = Object.fromEntries(wallets.map((w) => [w.id, w.coinType]));

  const networkBreakdown = byWallet.map((b) => ({
    name: walletMap[b.walletId ?? ""] ?? "Unknown",
    value: b._count,
    volume: Number(b._sum.amount ?? 0),
  }));

  const totalCount = totals._count;
  const totalVolume = Number(totals._sum.amount ?? 0);

  return {
    data: {
      volumeSeries, countSeries, totalVolume, totalCount,
      avgSize: totalCount > 0 ? totalVolume / totalCount : 0,
      networkBreakdown,
    },
  };
}

// ─── Withdrawal Analytics ─────────────────────────────────────────────────────

export async function getWithdrawalAnalytics(period: PeriodFilter = "30d"): Promise<{ data?: WithdrawalAnalyticsData; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const sinceDate = since(period);
  const dates = dateRange(period);

  const volumeSeries: TimeSeriesPoint[] = [];
  for (let i = 0; i < dates.length - 1; i++) {
    const agg = await prisma.divaWithdrawal.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: dates[i], lt: dates[i + 1] } },
    });
    volumeSeries.push({ date: fmtDate(dates[i]), value: Number(agg._sum.amount ?? 0) });
  }

  const byStatus = await prisma.divaWithdrawal.groupBy({
    by: ["status"],
    where: { createdAt: { gte: sinceDate } },
    _count: true,
  });

  const statusBreakdown = byStatus.map((b) => ({ name: b.status, value: b._count }));
  const totals = await prisma.divaWithdrawal.aggregate({ _sum: { amount: true }, _count: true, where: { createdAt: { gte: sinceDate } } });
  const approved = byStatus.find((b) => b.status === "APPROVED")?._count ?? 0;
  const pending = byStatus.find((b) => b.status === "PENDING")?._count ?? 0;

  return {
    data: {
      volumeSeries, statusBreakdown,
      totalVolume: Number(totals._sum.amount ?? 0),
      totalCount: totals._count,
      approvalRate: totals._count > 0 ? Math.round((approved / totals._count) * 100) : 0,
      pendingCount: pending,
    },
  };
}

// ─── Portfolio Analytics ──────────────────────────────────────────────────────

export async function getPortfolioAnalytics(): Promise<{ data?: PortfolioAnalyticsData; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const portfolios = await prisma.divaPortfolio.findMany({
    select: { currentBalance: true, status: true, createdAt: true },
  });

  const byStatus = portfolios.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  const statusBreakdown = Object.entries(byStatus).map(([name, value]) => ({ name, value }));
  const active = portfolios.filter((p) => p.status === "ACTIVE");
  const totalValue = active.reduce((s, p) => s + Number(p.currentBalance), 0);

  // Growth series: portfolio creations over time
  const dates = dateRange("30d");
  const valueSeries: TimeSeriesPoint[] = [];
  for (let i = 0; i < dates.length - 1; i++) {
    const count = portfolios.filter((p) => p.createdAt >= dates[i] && p.createdAt < dates[i + 1]).length;
    valueSeries.push({ date: fmtDate(dates[i]), value: count });
  }

  return {
    data: {
      totalValue,
      activeCount: active.length,
      valueSeries,
      statusBreakdown,
      avgBalance: active.length > 0 ? totalValue / active.length : 0,
    },
  };
}

// ─── Referral Analytics ───────────────────────────────────────────────────────

export async function getReferralAnalytics(period: PeriodFilter = "30d"): Promise<{ data?: ReferralAnalyticsData; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const sinceDate = since(period);
  const dates = dateRange(period);

  const series: TimeSeriesPoint[] = [];
  for (let i = 0; i < dates.length - 1; i++) {
    const count = await prisma.divaReferral.count({ where: { createdAt: { gte: dates[i], lt: dates[i + 1] } } });
    series.push({ date: fmtDate(dates[i]), value: count });
  }

  const [total, clicked, registered, kycDone, activated] = await Promise.all([
    prisma.divaReferral.count({ where: { createdAt: { gte: sinceDate } } }),
    prisma.divaReferral.count({ where: { createdAt: { gte: sinceDate }, status: { in: ["CLICKED", "REGISTERED", "KYC_COMPLETED", "ACTIVATED"] } } }),
    prisma.divaReferral.count({ where: { createdAt: { gte: sinceDate }, status: { in: ["REGISTERED", "KYC_COMPLETED", "ACTIVATED"] } } }),
    prisma.divaReferral.count({ where: { createdAt: { gte: sinceDate }, status: { in: ["KYC_COMPLETED", "ACTIVATED"] } } }),
    prisma.divaReferral.count({ where: { createdAt: { gte: sinceDate }, status: "ACTIVATED" } }),
  ]);

  const funnel = [
    { stage: "Invited", count: total, pct: 100 },
    { stage: "Clicked", count: clicked, pct: total > 0 ? Math.round((clicked / total) * 100) : 0 },
    { stage: "Registered", count: registered, pct: total > 0 ? Math.round((registered / total) * 100) : 0 },
    { stage: "KYC Done", count: kycDone, pct: total > 0 ? Math.round((kycDone / total) * 100) : 0 },
    { stage: "Activated", count: activated, pct: total > 0 ? Math.round((activated / total) * 100) : 0 },
  ];

  const topRows = await prisma.divaReferral.groupBy({
    by: ["referrerId"],
    _count: true,
    orderBy: { _count: { referrerId: "desc" } },
    take: 10,
  });

  const topUsers = await prisma.user.findMany({
    where: { id: { in: topRows.map((r) => r.referrerId) } },
    select: { id: true, name: true, email: true },
  });
  const userMap = Object.fromEntries(topUsers.map((u) => [u.id, u]));

  const activeMap = await prisma.divaReferral.groupBy({
    by: ["referrerId"],
    where: { referrerId: { in: topRows.map((r) => r.referrerId) }, status: "ACTIVATED" },
    _count: true,
  });
  const activeCountMap = Object.fromEntries(activeMap.map((r) => [r.referrerId, r._count]));

  const topReferrers = topRows.map((r) => ({
    name: userMap[r.referrerId]?.name ?? "Unknown",
    email: userMap[r.referrerId]?.email ?? "",
    count: r._count,
    activated: activeCountMap[r.referrerId] ?? 0,
  }));

  const rewardTotal = await prisma.divaUserReward.aggregate({ _sum: { rewardValue: true }, where: { rewardType: "POINTS" } });

  return {
    data: {
      series, funnel, topReferrers,
      conversionRate: total > 0 ? Math.round((activated / total) * 100) : 0,
      totalRewards: rewardTotal._sum.rewardValue ?? 0,
    },
  };
}

// ─── Community Analytics ──────────────────────────────────────────────────────

export async function getCommunityAnalytics() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const [totalAnnouncements, published, bookmarks, achievements, userAchievements, rewards] = await Promise.all([
    prisma.divaAnnouncement.count(),
    prisma.divaAnnouncement.count({ where: { status: "PUBLISHED" } }),
    prisma.divaAnnouncementBookmark.count(),
    prisma.divaAchievement.count({ where: { isActive: true } }),
    prisma.divaUserAchievement.count(),
    prisma.divaUserReward.count(),
  ]);

  const topAnnouncements = await prisma.divaAnnouncement.findMany({
    where: { status: "PUBLISHED" },
    include: { _count: { select: { bookmarks: true } } },
    orderBy: { bookmarks: { _count: "desc" } },
    take: 5,
  });

  return {
    data: {
      totalAnnouncements, published, bookmarks,
      achievements, userAchievements, rewards,
      engagementRate: published > 0 ? Math.round((bookmarks / published) * 100) : 0,
      topAnnouncements: topAnnouncements.map((a) => ({
        title: a.title, category: a.category, bookmarks: a._count.bookmarks,
      })),
    },
  };
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export async function getAuditLogs(filters?: {
  action?: string; performedBy?: string;
  from?: string; to?: string; page?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const page = filters?.page ?? 1;
  const limit = 50;
  const where = {
    ...(filters?.action ? { action: filters.action as any } : {}),
    ...(filters?.performedBy ? { performedBy: filters.performedBy } : {}),
    ...(filters?.from || filters?.to ? {
      createdAt: {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      },
    } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.divaAuditLog.findMany({
      where,
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.divaAuditLog.count({ where }),
  ]);

  return {
    data: items.map((a) => ({
      id: a.id,
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      actorName: a.actor?.name ?? null,
      actorEmail: a.actor?.email ?? null,
      ipAddress: a.ipAddress,
      createdAt: a.createdAt.toISOString(),
      metadata: a.metadata,
    })),
    total, page, pages: Math.ceil(total / limit),
  };
}
