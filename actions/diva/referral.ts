"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ReferralStats, ReferralRow, LeaderboardEntry, GrowthAnalytics } from "@/types/diva/referral";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateReferralCode(userId: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function ensureReferralCode(userId: string): Promise<string> {
  const profile = await prisma.divaProfile.findUnique({ where: { userId }, select: { referralCode: true } });
  if (profile?.referralCode) return profile.referralCode;

  let code: string;
  let tries = 0;
  do {
    code = generateReferralCode(userId);
    tries++;
    const exists = await prisma.divaProfile.findFirst({ where: { referralCode: code } });
    if (!exists) break;
  } while (tries < 10);

  await prisma.divaProfile.upsert({
    where: { userId },
    update: { referralCode: code! },
    create: { userId, referralCode: code! },
  });

  return code!;
}

// ─── User Actions ─────────────────────────────────────────────────────────────

export async function getReferralStats(): Promise<{ data?: ReferralStats; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const userId = session.user.id;
  const code = await ensureReferralCode(userId);

  const referrals = await prisma.divaReferral.findMany({
    where: { referrerId: userId },
    select: { status: true },
  });

  const totalReferrals = referrals.length;
  const successfulReferrals = referrals.filter((r) => r.status === "ACTIVATED").length;
  const pendingReferrals = referrals.filter((r) => ["PENDING", "CLICKED", "REGISTERED"].includes(r.status)).length;

  const pointsRows = await prisma.divaUserReward.findMany({
    where: { userId, rewardType: "POINTS" },
    select: { rewardValue: true },
  });
  const pointsEarned = pointsRows.reduce((sum, r) => sum + r.rewardValue, 0);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3003";

  return {
    data: {
      totalReferrals,
      successfulReferrals,
      pendingReferrals,
      pointsEarned,
      referralCode: code,
      referralLink: `${baseUrl}/diva-app/register?ref=${code}`,
    },
  };
}

export async function getMyReferrals(): Promise<{ data?: ReferralRow[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const referrals = await prisma.divaReferral.findMany({
    where: { referrerId: session.user.id },
    include: { referred: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: referrals.map((r) => ({
      id: r.id,
      referredName: r.referred.name ?? "Unknown",
      referredEmail: r.referred.email ?? "",
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      activatedAt: r.activatedAt?.toISOString() ?? null,
      kycCompletedAt: r.kycCompletedAt?.toISOString() ?? null,
    })),
  };
}

export async function getLeaderboard(
  period: "weekly" | "monthly" | "all_time" = "all_time"
): Promise<{ data?: LeaderboardEntry[]; error?: string }> {
  const since =
    period === "weekly"
      ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      : period === "monthly"
      ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      : new Date(0);

  const rows = await prisma.divaReferral.groupBy({
    by: ["referrerId"],
    where: { createdAt: { gte: since } },
    _count: { id: true },
  });

  if (!rows.length) return { data: [] };

  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.referrerId) } },
    select: { id: true, name: true, email: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const activeCounts = await prisma.divaReferral.groupBy({
    by: ["referrerId"],
    where: { referrerId: { in: rows.map((r) => r.referrerId) }, status: "ACTIVATED", createdAt: { gte: since } },
    _count: { id: true },
  });
  const activeMap = Object.fromEntries(activeCounts.map((r) => [r.referrerId, r._count.id]));

  const pointsRows = await prisma.divaUserReward.groupBy({
    by: ["userId"],
    where: { userId: { in: rows.map((r) => r.referrerId) }, rewardType: "POINTS" },
    _sum: { rewardValue: true },
  });
  const pointsMap = Object.fromEntries(pointsRows.map((r) => [r.userId, r._sum.rewardValue ?? 0]));

  const sorted = rows
    .sort((a, b) => b._count.id - a._count.id)
    .slice(0, 50)
    .map((r, i) => {
      const total = r._count.id;
      const badge = total >= 10 ? "🥇" : total >= 5 ? "🥈" : total >= 1 ? "🥉" : "–";
      return {
        rank: i + 1,
        userId: r.referrerId,
        name: userMap[r.referrerId]?.name ?? "Unknown",
        email: userMap[r.referrerId]?.email ?? "",
        totalReferrals: total,
        successfulReferrals: activeMap[r.referrerId] ?? 0,
        pointsEarned: pointsMap[r.referrerId] ?? 0,
        badge,
      };
    });

  return { data: sorted };
}

export async function getGrowthAnalytics(): Promise<{ data?: GrowthAnalytics; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // Weekly referrals (last 8 weeks)
  const weeks: { week: string; count: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
    const count = await prisma.divaReferral.count({ where: { referrerId: session.user.id, createdAt: { gte: start, lt: end } } });
    weeks.push({ week: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }), count });
  }

  const total = await prisma.divaReferral.count({ where: { referrerId: session.user.id } });
  const activated = await prisma.divaReferral.count({ where: { referrerId: session.user.id, status: "ACTIVATED" } });
  const kycDone = await prisma.divaReferral.count({ where: { referrerId: session.user.id, status: { in: ["KYC_COMPLETED", "ACTIVATED"] } } });

  const { data: topReferrers } = await getLeaderboard("all_time");

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const newUsersThisMonth = await prisma.user.count({ where: { createdAt: { gte: monthStart } } });
  const totalUsers = await prisma.user.count();

  return {
    data: {
      weeklyReferrals: weeks,
      conversionRate: total > 0 ? Math.round((activated / total) * 100) : 0,
      topReferrers: topReferrers ?? [],
      totalUsers,
      newUsersThisMonth,
      kycConversionRate: total > 0 ? Math.round((kycDone / total) * 100) : 0,
    },
  };
}

// ─── Admin Actions ────────────────────────────────────────────────────────────

export async function adminGetAllReferrals(page = 1, limit = 20) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.divaReferral.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        referrer: { select: { name: true, email: true } },
        referred: { select: { name: true, email: true } },
      },
    }),
    prisma.divaReferral.count(),
  ]);

  return {
    data: items.map((r) => ({
      id: r.id,
      referrerName: r.referrer.name ?? "–",
      referrerEmail: r.referrer.email ?? "–",
      referredName: r.referred.name ?? "–",
      referredEmail: r.referred.email ?? "–",
      status: r.status,
      referralCode: r.referralCode,
      createdAt: r.createdAt.toISOString(),
      activatedAt: r.activatedAt?.toISOString() ?? null,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}
