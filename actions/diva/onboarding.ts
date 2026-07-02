"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getOnboardingStatus() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const [profile, kyc, deposit] = await Promise.all([
    prisma.divaProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.divaKYCSubmission.findUnique({ where: { userId: session.user.id } }),
    prisma.divaDeposit.findFirst({ where: { userId: session.user.id, status: "APPROVED" } }),
  ]);

  const steps = [
    { id: "account", label: "Account Created", desc: "Your STICKO account is ready", done: true },
    { id: "profile", label: "Complete Profile", desc: "Add your personal details", done: !!(profile?.address && profile?.dateOfBirth) },
    { id: "kyc", label: "KYC Verification", desc: "Upload identity documents", done: !!(kyc && ["APPROVED", "UNDER_REVIEW"].includes(kyc.status)) },
    { id: "deposit", label: "First Deposit", desc: "Fund your portfolio", done: !!deposit },
  ];

  const completed = steps.filter((s) => s.done).length;
  const allDone = completed === steps.length;

  if (allDone && !profile?.onboardingCompleted) {
    await prisma.divaProfile.update({
      where: { userId: session.user.id },
      data: { onboardingCompleted: true },
    });
  }

  return { steps, completed, total: steps.length, allDone, profile };
}

export async function dismissOnboarding() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.divaProfile.upsert({
    where: { userId: session.user.id },
    update: { onboardingCompleted: true },
    create: { userId: session.user.id, onboardingCompleted: true },
  });

  return { success: true };
}
