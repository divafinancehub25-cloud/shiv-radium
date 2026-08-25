"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) throw new Error("Forbidden");
  return session.user.id;
}

export async function listUsers(opts: { search?: string; status?: string; page?: number } = {}) {
  await requireAdmin();
  const { search, status, page = 1 } = opts;
  const take = 20;
  const skip = (page - 1) * take;

  const where = {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search } },
            ],
          }
        : {},
      status ? { divaProfile: { accountStatus: status as never } } : {},
    ],
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        isActive: true,
        divaProfile: { select: { accountStatus: true, referralCode: true } },
        divaKYC: { select: { status: true, submittedAt: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, pages: Math.ceil(total / take) };
}

export async function getUserDetail(userId: string) {
  await requireAdmin();
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      divaProfile: true,
      divaKYC: { include: { documents: true } },
      divaLoginHistory: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  return { success: true };
}

export async function listKYCQueue(status?: string) {
  await requireAdmin();
  return prisma.divaKYCSubmission.findMany({
    where: status ? { status: status as never } : { status: { in: ["PENDING", "UNDER_REVIEW"] } },
    orderBy: { submittedAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      documents: true,
    },
  });
}

export async function setKYCUnderReview(kycId: string) {
  const adminId = await requireAdmin();
  await prisma.divaKYCSubmission.update({
    where: { id: kycId },
    data: { status: "UNDER_REVIEW", reviewedBy: adminId },
  });
  return { success: true };
}

// ── Full member control (admin) ───────────────────────────────────────────────

/** Comprehensive read of one member — profile, KYC, portfolio, recent activity. */
export async function adminGetMemberFull(userId: string) {
  await requireAdmin();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      divaProfile: true,
      divaKYC: { include: { documents: true } },
      divaPortfolio: true,
    },
  });
  if (!user) return { error: "User not found" as const };

  const [deposits, withdrawals] = await Promise.all([
    prisma.divaDeposit.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, amount: true, coinType: true, network: true, status: true, createdAt: true },
    }),
    prisma.divaWithdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, amount: true, status: true, createdAt: true },
    }),
  ]);

  return { user, deposits, withdrawals };
}

/** Admin edits a member's account + profile details. */
export async function adminUpdateUser(
  userId: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    isActive?: boolean;
    walletAddress?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    nationality?: string;
    dateOfBirth?: string;
  }
) {
  const adminId = await requireAdmin();

  const userFields: Record<string, unknown> = {};
  if (data.name !== undefined) userFields.name = data.name;
  if (data.email !== undefined) userFields.email = data.email;
  if (data.phone !== undefined) userFields.phone = data.phone;
  if (data.isActive !== undefined) userFields.isActive = data.isActive;

  const profileFields: Record<string, unknown> = {};
  for (const k of ["walletAddress", "address", "city", "state", "country", "postalCode", "nationality", "dateOfBirth"] as const) {
    if (data[k] !== undefined) profileFields[k] = data[k];
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (Object.keys(userFields).length > 0) {
        await tx.user.update({ where: { id: userId }, data: userFields });
      }
      if (Object.keys(profileFields).length > 0) {
        await tx.divaProfile.upsert({
          where: { userId },
          create: { userId, ...profileFields },
          update: profileFields,
        });
      }
    });
  } catch (e: any) {
    if (String(e?.message ?? "").includes("Unique")) return { error: "Email or phone already in use" as const };
    return { error: "Update failed" as const };
  }

  return { success: true, by: adminId };
}

/** Admin resets a member's login password. */
export async function adminResetUserPassword(userId: string, newPassword: string) {
  await requireAdmin();
  if (!newPassword || newPassword.length < 8) return { error: "Password must be at least 8 characters" as const };
  const bcrypt = (await import("bcryptjs")).default;
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { success: true };
}
