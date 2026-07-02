"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { AchievementRow } from "@/types/diva/referral";
import type { DivaAchievementTrigger } from "@prisma/client";
import { sendAchievementEmail } from "@/lib/diva/email";

export async function getMyAchievements(): Promise<{ data?: AchievementRow[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const [all, earned] = await Promise.all([
    prisma.divaAchievement.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.divaUserAchievement.findMany({ where: { userId: session.user.id }, select: { achievementId: true, earnedAt: true } }),
  ]);

  const earnedMap = Object.fromEntries(earned.map((e) => [e.achievementId, e.earnedAt.toISOString()]));

  return {
    data: all.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      badgeIcon: a.badgeIcon,
      badgeColor: a.badgeColor,
      trigger: a.trigger,
      earned: !!earnedMap[a.id],
      earnedAt: earnedMap[a.id] ?? null,
    })),
  };
}

// Internal: check and award achievements after key events
export async function checkAndAwardAchievements(userId: string, trigger: DivaAchievementTrigger) {
  const achievement = await prisma.divaAchievement.findFirst({
    where: { trigger, isActive: true },
  });
  if (!achievement) return;

  const already = await prisma.divaUserAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
  });
  if (already) return;

  await prisma.divaUserAchievement.create({
    data: { userId, achievementId: achievement.id },
  });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });

  await prisma.divaNotification.create({
    data: {
      userId,
      title: "Achievement Unlocked! 🏆",
      message: `You earned "${achievement.name}" — ${achievement.description}`,
      type: "achievement",
      link: "/diva-app/achievements",
    },
  });

  try {
    if (user?.email) {
      await sendAchievementEmail(
        user.email,
        user.name ?? "Member",
        achievement.name,
        achievement.badgeEmoji ?? "🏆",
        achievement.description ?? ""
      );
    }
  } catch {
    // non-critical
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function adminGetAchievements() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const items = await prisma.divaAchievement.findMany({ orderBy: { sortOrder: "asc" } });
  return {
    data: items.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      badgeIcon: a.badgeIcon,
      badgeColor: a.badgeColor,
      trigger: a.trigger,
      isActive: a.isActive,
      sortOrder: a.sortOrder,
    })),
  };
}

export async function adminCreateAchievement(data: {
  name: string;
  description: string;
  badgeIcon?: string;
  badgeColor?: string;
  trigger: DivaAchievementTrigger;
  sortOrder?: number;
}): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.divaAchievement.create({ data });
  revalidatePath("/diva-app-admin/achievements");
  return { success: true };
}

export async function adminSeedDefaultAchievements(): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const defaults = [
    { name: "Profile Star", description: "Complete your profile", badgeIcon: "⭐", badgeColor: "#D4AF37", trigger: "PROFILE_COMPLETED" as DivaAchievementTrigger, sortOrder: 1 },
    { name: "Identity Verified", description: "KYC approved", badgeIcon: "✅", badgeColor: "#22c55e", trigger: "KYC_APPROVED" as DivaAchievementTrigger, sortOrder: 2 },
    { name: "First Investment", description: "Made your first deposit", badgeIcon: "💰", badgeColor: "#f59e0b", trigger: "FIRST_DEPOSIT" as DivaAchievementTrigger, sortOrder: 3 },
    { name: "Connector", description: "Sent your first referral", badgeIcon: "🤝", badgeColor: "#6366f1", trigger: "FIRST_REFERRAL" as DivaAchievementTrigger, sortOrder: 4 },
    { name: "Community Builder", description: "Referred 5 members", badgeIcon: "🌟", badgeColor: "#ec4899", trigger: "FIVE_REFERRALS" as DivaAchievementTrigger, sortOrder: 5 },
    { name: "Growth Champion", description: "Referred 10 members", badgeIcon: "🏆", badgeColor: "#D4AF37", trigger: "TEN_REFERRALS" as DivaAchievementTrigger, sortOrder: 6 },
  ];

  for (const d of defaults) {
    const exists = await prisma.divaAchievement.findFirst({ where: { trigger: d.trigger } });
    if (!exists) await prisma.divaAchievement.create({ data: d });
  }

  revalidatePath("/diva-app-admin/achievements");
  return { success: true };
}
