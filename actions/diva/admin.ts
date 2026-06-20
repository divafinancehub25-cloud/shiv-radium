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
