"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createWithdrawalSchema, reviewWithdrawalSchema, cancelWithdrawalSchema } from "@/lib/diva/validators/withdrawal";
import { writeFinancialOpsLog } from "@/lib/diva/financial-ops";
import { createNotification } from "@/lib/diva/notifications";
import { sendWithdrawalStatusEmail } from "@/lib/diva/email";
import { lockFunds, unlockFunds, settleFunds } from "@/lib/diva/withdrawal-engine";
import type { DivaWithdrawalStatus } from "@prisma/client";

async function getIp() {
  const h = await headers();
  return h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "unknown";
}

function maskAddress(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ── User: balance summary ───────────────────────────────────────────────────────
export async function getWithdrawalSummary() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const [portfolio, pendingCount] = await Promise.all([
    prisma.divaPortfolio.findUnique({ where: { userId: session.user.id } }),
    prisma.divaWithdrawal.count({
      where: { userId: session.user.id, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    }),
  ]);

  return {
    summary: {
      currentBalance: Number(portfolio?.currentBalance ?? 0),
      availableBalance: Number(portfolio?.availableBalance ?? 0),
      lockedBalance: Number(portfolio?.lockedBalance ?? 0),
      pendingCount,
      portfolioStatus: portfolio?.status ?? "ACTIVE",
    },
  };
}

// ── User: submit withdrawal ─────────────────────────────────────────────────────
export async function createWithdrawal(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = createWithdrawalSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { amount, walletAddress, network, userNotes } = parsed.data;

  const portfolio = await prisma.divaPortfolio.findUnique({ where: { userId: session.user.id } });
  if (!portfolio) return { error: "No portfolio found. Make a deposit first." };

  // Account-state gating (Module 8)
  if (portfolio.status === "FROZEN") return { error: "Your account is frozen. Withdrawals are disabled." };
  if (portfolio.status === "SUSPENDED") return { error: "Your account is suspended. No financial actions allowed." };
  if (portfolio.status === "CLOSED") return { error: "Your account is closed (read-only)." };

  if (amount > Number(portfolio.availableBalance)) {
    return { error: "Amount exceeds your available balance." };
  }

  // Prevent rapid duplicate requests (same amount + address within 60s)
  const dup = await prisma.divaWithdrawal.findFirst({
    where: {
      userId: session.user.id,
      walletAddress,
      amount,
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      submittedAt: { gte: new Date(Date.now() - 60_000) },
    },
  });
  if (dup) return { error: "Duplicate request detected. Please wait a moment." };

  // Atomic: lock funds + create request + status history
  let withdrawal;
  try {
    withdrawal = await prisma.$transaction(async (tx) => {
      await lockFunds(tx, session.user.id, amount);
      const w = await tx.divaWithdrawal.create({
        data: {
          userId: session.user.id,
          amount,
          walletAddress,
          network,
          status: "SUBMITTED",
          userNotes: userNotes || null,
        },
      });
      await tx.divaWithdrawalStatusHistory.create({
        data: { withdrawalId: w.id, oldStatus: null, newStatus: "SUBMITTED", changedBy: session.user.id, notes: "Request submitted" },
      });
      return w;
    });
  } catch (e: any) {
    return { error: e?.message ?? "Failed to submit withdrawal" };
  }

  await writeFinancialOpsLog({
    actionType: "WITHDRAWAL_SUBMITTED",
    referenceId: withdrawal.id,
    userId: session.user.id,
    performedBy: session.user.id,
    ipAddress: await getIp(),
    metadata: { amount: String(amount), network, walletAddress: maskAddress(walletAddress) },
  });

  await createNotification({
    userId: session.user.id,
    title: "Withdrawal Submitted",
    message: `Your withdrawal of ${amount} USDT (${network}) is under review.`,
    type: "info",
    link: "/diva-app/withdraw/history",
  });

  revalidatePath("/diva-app/withdraw");
  revalidatePath("/diva-app/withdraw/history");
  revalidatePath("/diva-app/portfolio");
  return { withdrawal };
}

// ── User: list own withdrawals ──────────────────────────────────────────────────
export async function getUserWithdrawals({
  page = 1,
  limit = 10,
  status,
  search,
}: { page?: number; limit?: number; status?: string; search?: string } = {}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const where: any = {
    userId: session.user.id,
    ...(status && status !== "ALL" ? { status } : {}),
    ...(search ? { OR: [{ walletAddress: { contains: search, mode: "insensitive" } }, { id: { contains: search } }] } : {}),
  };

  const [withdrawals, total] = await Promise.all([
    prisma.divaWithdrawal.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.divaWithdrawal.count({ where }),
  ]);

  return { withdrawals, total, pages: Math.ceil(total / limit) };
}

// ── User: withdrawal detail + status timeline ───────────────────────────────────
export async function getWithdrawalDetail(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const withdrawal = await prisma.divaWithdrawal.findUnique({
    where: { id },
    include: { statusHistory: { orderBy: { createdAt: "asc" } }, reviewer: { select: { id: true, name: true } } },
  });
  if (!withdrawal) return { error: "Not found" };

  const isOwner = withdrawal.userId === session.user.id;
  const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "");
  if (!isOwner && !isAdmin) return { error: "Unauthorized" };

  return { withdrawal };
}

// ── User: cancel pending request ────────────────────────────────────────────────
export async function cancelWithdrawal(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = cancelWithdrawalSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const w = await prisma.divaWithdrawal.findUnique({ where: { id: parsed.data.withdrawalId } });
  if (!w) return { error: "Not found" };
  if (w.userId !== session.user.id) return { error: "Unauthorized" };
  if (!["SUBMITTED", "UNDER_REVIEW"].includes(w.status)) return { error: "Only pending requests can be cancelled." };

  try {
    await prisma.$transaction(async (tx) => {
      await unlockFunds(tx, w.userId, Number(w.amount));
      await tx.divaWithdrawal.update({ where: { id: w.id }, data: { status: "CANCELLED" } });
      await tx.divaWithdrawalStatusHistory.create({
        data: { withdrawalId: w.id, oldStatus: w.status, newStatus: "CANCELLED", changedBy: session.user.id, notes: "Cancelled by user" },
      });
    });
  } catch (e: any) {
    return { error: e?.message ?? "Failed to cancel" };
  }

  await writeFinancialOpsLog({
    actionType: "WITHDRAWAL_CANCELLED",
    referenceId: w.id,
    userId: w.userId,
    performedBy: session.user.id,
    ipAddress: await getIp(),
    metadata: { amount: String(w.amount) },
  });

  await createNotification({
    userId: w.userId,
    title: "Withdrawal Cancelled",
    message: `Your withdrawal of ${w.amount} USDT was cancelled and funds released.`,
    type: "info",
    link: "/diva-app/withdraw/history",
  });

  revalidatePath("/diva-app/withdraw");
  revalidatePath("/diva-app/withdraw/history");
  revalidatePath("/diva-app/portfolio");
  return { success: true };
}

// ── Admin: list all withdrawals ─────────────────────────────────────────────────
export async function adminListWithdrawals({
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
            { walletAddress: { contains: search, mode: "insensitive" } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { user: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [withdrawals, total] = await Promise.all([
    prisma.divaWithdrawal.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true } },
      },
    }),
    prisma.divaWithdrawal.count({ where }),
  ]);

  return { withdrawals, total, pages: Math.ceil(total / limit) };
}

// ── Admin: get withdrawal + user context ────────────────────────────────────────
export async function adminGetWithdrawal(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) return { error: "Unauthorized" };

  const withdrawal = await prisma.divaWithdrawal.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      reviewer: { select: { id: true, name: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!withdrawal) return { error: "Not found" };

  const [portfolio, recentLedger] = await Promise.all([
    prisma.divaPortfolio.findUnique({ where: { userId: withdrawal.userId } }),
    prisma.divaLedgerEntry.findMany({
      where: { userId: withdrawal.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, transactionType: true, amount: true, newBalance: true, createdAt: true, notes: true },
    }),
  ]);

  return {
    withdrawal,
    portfolio: portfolio
      ? {
          currentBalance: Number(portfolio.currentBalance),
          availableBalance: Number(portfolio.availableBalance),
          lockedBalance: Number(portfolio.lockedBalance),
          status: portfolio.status,
        }
      : null,
    recentLedger,
  };
}

// ── Admin: review (approve / reject / under-review) ──────────────────────────────
export async function reviewWithdrawal(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) return { error: "Unauthorized" };

  const parsed = reviewWithdrawalSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { withdrawalId, action, adminNotes } = parsed.data;
  const adminId = session.user.id;

  const existing = await prisma.divaWithdrawal.findUnique({
    where: { id: withdrawalId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!existing) return { error: "Withdrawal not found" };
  if (["APPROVED", "REJECTED", "COMPLETED", "CANCELLED"].includes(existing.status)) {
    return { error: `Request already ${existing.status.toLowerCase()}.` };
  }

  const amount = Number(existing.amount);
  const oldStatus = existing.status as DivaWithdrawalStatus;

  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      if (action === "APPROVED") {
        // Permanently settle: debit current + locked, immutable ledger entry
        const ledgerId = await settleFunds(tx, existing.userId, amount, withdrawalId, adminId);
        const w = await tx.divaWithdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: "COMPLETED",
            adminNotes: adminNotes || null,
            reviewedBy: adminId,
            reviewedAt: new Date(),
            completedAt: new Date(),
            ledgerEntryId: ledgerId,
          },
        });
        await tx.divaWithdrawalStatusHistory.create({
          data: { withdrawalId, oldStatus, newStatus: "APPROVED", changedBy: adminId, notes: adminNotes || "Approved" },
        });
        await tx.divaWithdrawalStatusHistory.create({
          data: { withdrawalId, oldStatus: "APPROVED", newStatus: "COMPLETED", changedBy: adminId, notes: "Funds settled" },
        });
        return w;
      }

      if (action === "REJECTED") {
        // Release locked funds back to available — balance preserved
        await unlockFunds(tx, existing.userId, amount);
        const w = await tx.divaWithdrawal.update({
          where: { id: withdrawalId },
          data: { status: "REJECTED", adminNotes: adminNotes || null, reviewedBy: adminId, reviewedAt: new Date() },
        });
        await tx.divaWithdrawalStatusHistory.create({
          data: { withdrawalId, oldStatus, newStatus: "REJECTED", changedBy: adminId, notes: adminNotes || "Rejected" },
        });
        return w;
      }

      // UNDER_REVIEW — no balance change
      const w = await tx.divaWithdrawal.update({
        where: { id: withdrawalId },
        data: { status: "UNDER_REVIEW", adminNotes: adminNotes || null, reviewedBy: adminId, reviewedAt: new Date() },
      });
      await tx.divaWithdrawalStatusHistory.create({
        data: { withdrawalId, oldStatus, newStatus: "UNDER_REVIEW", changedBy: adminId, notes: adminNotes || "Marked under review" },
      });
      return w;
    });
  } catch (e: any) {
    return { error: e?.message ?? "Failed to process withdrawal" };
  }

  const opsAction =
    action === "APPROVED" ? "WITHDRAWAL_COMPLETED" : action === "REJECTED" ? "WITHDRAWAL_REJECTED" : "STATUS_CHANGED";

  await writeFinancialOpsLog({
    actionType: opsAction as any,
    referenceId: withdrawalId,
    userId: existing.userId,
    performedBy: adminId,
    ipAddress: await getIp(),
    metadata: { action, adminNotes, amount: String(amount) },
  });

  if (action === "APPROVED" || action === "REJECTED") {
    await createNotification({
      userId: existing.userId,
      title: action === "APPROVED" ? "Withdrawal Approved ✅" : "Withdrawal Rejected ❌",
      message:
        action === "APPROVED"
          ? `Your withdrawal of ${amount} USDT has been approved and settled.`
          : `Your withdrawal was rejected and funds released. ${adminNotes ? "Reason: " + adminNotes : ""}`,
      type: action === "APPROVED" ? "success" : "error",
      link: "/diva-app/withdraw/history",
    });

    try {
      await sendWithdrawalStatusEmail(
        existing.user.email!,
        existing.user.name ?? "Member",
        action === "APPROVED" ? "APPROVED" : "REJECTED",
        String(amount),
        adminNotes
      );
    } catch {
      // email failure non-critical
    }
  }

  revalidatePath("/diva-app-admin/withdrawals");
  revalidatePath("/diva-app/withdraw/history");
  revalidatePath("/diva-app/portfolio");
  revalidatePath("/diva-app-admin/portfolio");
  return { withdrawal: updated };
}

// ── Admin: financial operations dashboard stats ─────────────────────────────────
export async function adminWithdrawalStats() {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) return { error: "Unauthorized" };

  const [total, submitted, underReview, approved, rejected, completed, cancelled, volumeResult] = await Promise.all([
    prisma.divaWithdrawal.count(),
    prisma.divaWithdrawal.count({ where: { status: "SUBMITTED" } }),
    prisma.divaWithdrawal.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.divaWithdrawal.count({ where: { status: "APPROVED" } }),
    prisma.divaWithdrawal.count({ where: { status: "REJECTED" } }),
    prisma.divaWithdrawal.count({ where: { status: "COMPLETED" } }),
    prisma.divaWithdrawal.count({ where: { status: "CANCELLED" } }),
    prisma.divaWithdrawal.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
  ]);

  const totalVolume = volumeResult._sum.amount?.toString() ?? "0";

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recent = await prisma.divaWithdrawal.findMany({
    where: { submittedAt: { gte: sevenDaysAgo } },
    select: { submittedAt: true, amount: true },
    orderBy: { submittedAt: "asc" },
  });

  const dailyMap = new Map<string, { count: number; volume: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toISOString().split("T")[0], { count: 0, volume: 0 });
  }
  for (const w of recent) {
    const day = w.submittedAt.toISOString().split("T")[0];
    const e = dailyMap.get(day);
    if (e) { e.count++; e.volume += Number(w.amount); }
  }

  return {
    stats: {
      total, submitted, underReview, approved, rejected, completed, cancelled, totalVolume,
      statusBreakdown: [
        { status: "SUBMITTED", count: submitted },
        { status: "UNDER_REVIEW", count: underReview },
        { status: "COMPLETED", count: completed },
        { status: "REJECTED", count: rejected },
        { status: "CANCELLED", count: cancelled },
      ],
      dailyActivity: Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v })),
    },
  };
}

// ── Admin: financial ops audit logs ─────────────────────────────────────────────
export async function adminFinancialOpsLogs({ page = 1, limit = 30 }: { page?: number; limit?: number } = {}) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) return { error: "Unauthorized" };

  const [logs, total] = await Promise.all([
    prisma.divaFinancialOpsLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.divaFinancialOpsLog.count(),
  ]);

  return { logs, total, pages: Math.ceil(total / limit) };
}
