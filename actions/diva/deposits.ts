"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { submitDepositSchema, reviewDepositSchema } from "@/lib/diva/validators/deposit";
import { writeAuditLog } from "@/lib/diva/audit";
import { createNotification } from "@/lib/diva/notifications";
import { sendDepositStatusEmail } from "@/lib/diva/email";
import { headers } from "next/headers";
import { creditPortfolio } from "@/lib/diva/ledger";

async function getIp() {
  const h = await headers();
  return h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "unknown";
}

// ── Submit deposit (user) ─────────────────────────────────────────────────────
export async function submitDeposit(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = submitDepositSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { walletId, amount, transactionHash, proofImageUrl, notes } = parsed.data;

  // Prevent duplicate transaction hashes
  const existing = await prisma.divaDeposit.findUnique({ where: { transactionHash } });
  if (existing) return { error: "Transaction hash already submitted" };

  const wallet = await prisma.divaDepositWallet.findFirst({
    where: { id: walletId, status: "ACTIVE" },
  });
  if (!wallet) return { error: "Wallet not found or inactive" };

  const deposit = await prisma.divaDeposit.create({
    data: {
      userId: session.user.id,
      walletId,
      coinType: wallet.coinType,
      network: wallet.network,
      amount,
      transactionHash,
      proofImageUrl: proofImageUrl || null,
      notes: notes || null,
      status: "PENDING",
    },
  });

  await writeAuditLog({
    action: "DEPOSIT_SUBMITTED",
    entityType: "DivaDeposit",
    entityId: deposit.id,
    performedBy: session.user.id,
    ipAddress: await getIp(),
    metadata: { amount: String(amount), coinType: wallet.coinType, network: wallet.network, transactionHash },
  });

  await createNotification({
    userId: session.user.id,
    title: "Deposit Submitted",
    message: `Your ${wallet.coinType} deposit of ${amount} is under review.`,
    type: "info",
    link: "/diva-app/deposit/history",
  });

  revalidatePath("/diva-app/deposit/history");
  return { deposit };
}

// ── Get user deposits ─────────────────────────────────────────────────────────
export async function getUserDeposits({
  page = 1,
  limit = 10,
  status,
}: { page?: number; limit?: number; status?: string } = {}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const where = {
    userId: session.user.id,
    ...(status && status !== "ALL" ? { status: status as any } : {}),
  };

  const [deposits, total] = await Promise.all([
    prisma.divaDeposit.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        wallet: { select: { walletName: true, coinType: true, network: true } },
      },
    }),
    prisma.divaDeposit.count({ where }),
  ]);

  return { deposits, total, pages: Math.ceil(total / limit) };
}

// ── Admin: list all deposits ───────────────────────────────────────────────────
export async function adminListDeposits({
  page = 1,
  limit = 20,
  status,
  search,
}: { page?: number; limit?: number; status?: string; search?: string } = {}) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) return { error: "Unauthorized" };

  const where: any = {
    ...(status && status !== "ALL" ? { status } : {}),
    ...(search
      ? {
          OR: [
            { transactionHash: { contains: search, mode: "insensitive" } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { user: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [deposits, total] = await Promise.all([
    prisma.divaDeposit.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        wallet: { select: { id: true, walletName: true, coinType: true, network: true, address: true } },
        reviewer: { select: { id: true, name: true } },
      },
    }),
    prisma.divaDeposit.count({ where }),
  ]);

  return { deposits, total, pages: Math.ceil(total / limit) };
}

// ── Admin: get deposit detail ─────────────────────────────────────────────────
export async function adminGetDeposit(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) return { error: "Unauthorized" };

  const deposit = await prisma.divaDeposit.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      wallet: true,
      reviewer: { select: { id: true, name: true } },
    },
  });
  if (!deposit) return { error: "Deposit not found" };
  return { deposit };
}

// ── Admin: review deposit ─────────────────────────────────────────────────────
export async function reviewDeposit(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) return { error: "Unauthorized" };

  const parsed = reviewDepositSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { depositId, action, adminNotes } = parsed.data;

  // Run deposit update + optional portfolio credit in one transaction
  const deposit = await prisma.$transaction(async (tx) => {
    const updated = await tx.divaDeposit.update({
      where: { id: depositId },
      data: {
        status: action,
        adminNotes: adminNotes || null,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (action === "APPROVED") {
      await creditPortfolio({
        userId: updated.userId,
        amount: updated.amount.toString(),
        transactionType: "DEPOSIT_CREDIT",
        referenceType: "DivaDeposit",
        referenceId: updated.id,
        notes: `Deposit approved — tx: ${updated.transactionHash}`,
        createdBy: session.user.id,
        tx,
      });
    }

    return updated;
  });

  const auditAction =
    action === "APPROVED"
      ? "DEPOSIT_APPROVED"
      : action === "REJECTED"
      ? "DEPOSIT_REJECTED"
      : "DEPOSIT_UNDER_REVIEW";

  await writeAuditLog({
    action: auditAction as any,
    entityType: "DivaDeposit",
    entityId: depositId,
    performedBy: session.user.id,
    ipAddress: await getIp(),
    metadata: { action, adminNotes, userId: deposit.userId },
  });

  // Notify the user
  if (action === "APPROVED" || action === "REJECTED") {
    const statusText = action === "APPROVED" ? "approved" : "rejected";
    await createNotification({
      userId: deposit.userId,
      title: `Deposit ${action === "APPROVED" ? "Approved ✅" : "Rejected ❌"}`,
      message:
        action === "APPROVED"
          ? `Your deposit has been approved. Funds will reflect shortly.`
          : `Your deposit was rejected. ${adminNotes ? "Reason: " + adminNotes : ""}`,
      type: action === "APPROVED" ? "success" : "error",
      link: "/diva-app/deposit/history",
    });

    try {
      await sendDepositStatusEmail(
        deposit.user.email!,
        deposit.user.name ?? "Member",
        action === "APPROVED" ? "APPROVED" : "REJECTED",
        deposit.amount.toString(),
        adminNotes
      );
    } catch {
      // email failure is non-critical
    }
  }

  revalidatePath("/diva-app-admin/deposits");
  revalidatePath("/diva-app/deposit/history");
  revalidatePath("/diva-app/portfolio");
  revalidatePath("/diva-app-admin/portfolio");
  return { deposit };
}

// ── Admin deposit stats ────────────────────────────────────────────────────────
export async function adminDepositStats() {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) return { error: "Unauthorized" };

  const [total, pending, underReview, approved, rejected, volumeResult] = await Promise.all([
    prisma.divaDeposit.count(),
    prisma.divaDeposit.count({ where: { status: "PENDING" } }),
    prisma.divaDeposit.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.divaDeposit.count({ where: { status: "APPROVED" } }),
    prisma.divaDeposit.count({ where: { status: "REJECTED" } }),
    prisma.divaDeposit.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true },
    }),
  ]);

  const totalVolume = volumeResult._sum.amount?.toString() ?? "0";

  // Network distribution
  const networkDist = await prisma.divaDeposit.groupBy({
    by: ["network"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  // Last 7 days activity
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentDeposits = await prisma.divaDeposit.findMany({
    where: { submittedAt: { gte: sevenDaysAgo } },
    select: { submittedAt: true, amount: true },
    orderBy: { submittedAt: "asc" },
  });

  // Group by day
  const dailyMap = new Map<string, { count: number; volume: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toISOString().split("T")[0], { count: 0, volume: 0 });
  }
  for (const dep of recentDeposits) {
    const day = dep.submittedAt.toISOString().split("T")[0];
    const entry = dailyMap.get(day);
    if (entry) {
      entry.count++;
      entry.volume += Number(dep.amount);
    }
  }

  const dailyActivity = Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v }));

  return {
    stats: { total, pending, underReview, approved, rejected, totalVolume },
    networkDist: networkDist.map((n) => ({ network: n.network, count: n._count.id })),
    statusBreakdown: [
      { status: "PENDING", count: pending },
      { status: "UNDER_REVIEW", count: underReview },
      { status: "APPROVED", count: approved },
      { status: "REJECTED", count: rejected },
    ],
    dailyActivity,
  };
}

// ── Admin: audit logs ─────────────────────────────────────────────────────────
export async function adminAuditLogs({
  page = 1,
  limit = 30,
}: { page?: number; limit?: number } = {}) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) return { error: "Unauthorized" };

  const [logs, total] = await Promise.all([
    prisma.divaAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { actor: { select: { id: true, name: true, email: true } } },
    }),
    prisma.divaAuditLog.count(),
  ]);

  return { logs, total, pages: Math.ceil(total / limit) };
}
