"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { RewardRow, RewardRuleRow } from "@/types/diva/referral";
import type { DivaRewardType } from "@prisma/client";
import { sendRewardGrantedEmail } from "@/lib/diva/email";

export async function getMyRewards(): Promise<{ data?: RewardRow[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const rows = await prisma.divaUserReward.findMany({
    where: { userId: session.user.id },
    orderBy: { awardedAt: "desc" },
  });

  return {
    data: rows.map((r) => ({
      id: r.id,
      rewardType: r.rewardType,
      rewardName: r.rewardName,
      rewardValue: r.rewardValue,
      status: r.status,
      awardedAt: r.awardedAt.toISOString(),
    })),
  };
}

export async function getRewardRules(): Promise<{ data?: RewardRuleRow[]; error?: string }> {
  const rules = await prisma.divaRewardRule.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: rules.map((r) => ({
      id: r.id,
      ruleName: r.ruleName,
      description: r.description,
      rewardType: r.rewardType,
      rewardValue: r.rewardValue,
      triggerEvent: r.triggerEvent,
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function adminGetRewardRules() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const rules = await prisma.divaRewardRule.findMany({ orderBy: { createdAt: "desc" } });
  return {
    data: rules.map((r) => ({
      id: r.id,
      ruleName: r.ruleName,
      description: r.description,
      rewardType: r.rewardType,
      rewardValue: r.rewardValue,
      triggerEvent: r.triggerEvent,
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export async function adminCreateRewardRule(data: {
  ruleName: string;
  description?: string;
  rewardType: DivaRewardType;
  rewardValue: number;
  triggerEvent: string;
}): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.divaRewardRule.create({
    data: { ...data, createdBy: session.user.id },
  });

  revalidatePath("/diva-app-admin/rewards");
  return { success: true };
}

export async function adminToggleRewardRule(id: string, isActive: boolean): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.divaRewardRule.update({ where: { id }, data: { isActive } });
  revalidatePath("/diva-app-admin/rewards");
  return { success: true };
}

export async function adminGrantReward(data: {
  userId: string;
  rewardType: DivaRewardType;
  rewardName: string;
  rewardValue: number;
}): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const reward = await prisma.divaUserReward.create({
    data,
    include: { user: { select: { name: true, email: true } } },
  });

  await prisma.divaNotification.create({
    data: {
      userId: data.userId,
      title: "Reward Earned! 🎁",
      message: `You've received ${data.rewardName} (${data.rewardValue} ${data.rewardType.toLowerCase()}).`,
      type: "reward",
      link: "/diva-app/achievements",
    },
  });

  try {
    await sendRewardGrantedEmail(
      reward.user.email ?? "",
      reward.user.name ?? "Member",
      data.rewardName,
      data.rewardValue,
      data.rewardType
    );
  } catch {
    // non-critical
  }

  revalidatePath("/diva-app-admin/rewards");
  return { success: true };
}

export async function adminGetUserRewards(userId?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const rows = await prisma.divaUserReward.findMany({
    where: userId ? { userId } : {},
    include: { user: { select: { name: true, email: true } } },
    orderBy: { awardedAt: "desc" },
    take: 100,
  });

  return {
    data: rows.map((r) => ({
      id: r.id,
      userName: r.user.name ?? "–",
      userEmail: r.user.email ?? "–",
      rewardType: r.rewardType,
      rewardName: r.rewardName,
      rewardValue: r.rewardValue,
      status: r.status,
      awardedAt: r.awardedAt.toISOString(),
    })),
  };
}
