"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { creditPortfolio, debitPortfolio } from "@/lib/diva/ledger";
import { writeAuditLog } from "@/lib/diva/audit";
import { createNotification } from "@/lib/diva/notifications";
import { adminAdjustSchema, adminStatusSchema } from "@/lib/diva/validators/portfolio";
import { headers } from "next/headers";

async function getIp() {
  const h = await headers();
  return h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "unknown";
}

// ─── User: Get own portfolio ───────────────────────────────────────────────────
export async function getUserPortfolio() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const portfolio = await prisma.divaPortfolio.findUnique({
    where: { userId: session.user.id },
  });

  if (!portfolio) {
    // Auto-create empty portfolio on first access
    const created = await prisma.divaPortfolio.create({
      data: { userId: session.user.id, currentBalance: 0, availableBalance: 0, lockedBalance: 0 },
    });
    return { portfolio: created };
  }

  return { portfolio };
}

// ─── User: Get own ledger entries ─────────────────────────────────────────────
export async function getUserLedger(page = 1, limit = 20) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const skip = (page - 1) * limit;
  const [entries, total] = await Promise.all([
    prisma.divaLedgerEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { creator: { select: { id: true, name: true } } },
    }),
    prisma.divaLedgerEntry.count({ where: { userId: session.user.id } }),
  ]);

  return { entries, total, page, limit, pages: Math.ceil(total / limit) };
}

// ─── User: Get portfolio events (timeline) ─────────────────────────────────────
export async function getUserPortfolioEvents(limit = 20) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const portfolio = await prisma.divaPortfolio.findUnique({ where: { userId: session.user.id } });
  if (!portfolio) return { events: [] };

  const events = await prisma.divaPortfolioEvent.findMany({
    where: { portfolioId: portfolio.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return { events };
}

// ─── User: Balance trend for chart (last 30 days) ─────────────────────────────
export async function getUserBalanceTrend() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const entries = await prisma.divaLedgerEntry.findMany({
    where: { userId: session.user.id, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true, newBalance: true, transactionType: true, amount: true },
  });

  // Group by date
  const map = new Map<string, { balance: number; deposits: number; adjustments: number }>();
  for (const e of entries) {
    const d = e.createdAt.toISOString().slice(0, 10);
    const prev = map.get(d) ?? { balance: 0, deposits: 0, adjustments: 0 };
    const amt = Math.abs(Number(e.amount));
    if (e.transactionType === "DEPOSIT_CREDIT") prev.deposits += amt;
    else prev.adjustments += amt;
    prev.balance = Number(e.newBalance);
    map.set(d, prev);
  }

  return { trend: Array.from(map.entries()).map(([date, v]) => ({ date, ...v })) };
}

// ─── Admin: List all portfolios ────────────────────────────────────────────────
export async function adminListPortfolios(page = 1, limit = 20, search?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) return { error: "Unauthorized" };

  const skip = (page - 1) * limit;
  const where = search
    ? { user: { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }] } }
    : {};

  const [portfolios, total] = await Promise.all([
    prisma.divaPortfolio.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { ledgerEntries: true } },
      },
    }),
    prisma.divaPortfolio.count({ where }),
  ]);

  return { portfolios, total, page, limit, pages: Math.ceil(total / limit) };
}

// ─── Admin: Get single user portfolio ─────────────────────────────────────────
export async function adminGetUserPortfolio(userId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) return { error: "Unauthorized" };

  const [portfolio, user] = await Promise.all([
    prisma.divaPortfolio.findUnique({
      where: { userId },
      include: { _count: { select: { ledgerEntries: true, events: true } } },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
  ]);

  if (!user) return { error: "User not found" };

  return { portfolio, user };
}

// ─── Admin: Get user ledger entries ───────────────────────────────────────────
export async function adminGetUserLedger(userId: string, page = 1, limit = 20) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) return { error: "Unauthorized" };

  const skip = (page - 1) * limit;
  const [entries, total] = await Promise.all([
    prisma.divaLedgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { creator: { select: { id: true, name: true } } },
    }),
    prisma.divaLedgerEntry.count({ where: { userId } }),
  ]);

  return { entries, total, page, limit, pages: Math.ceil(total / limit) };
}

// ─── Admin: Adjust balance ────────────────────────────────────────────────────
export async function adminAdjustBalance(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) return { error: "Unauthorized" };

  const parsed = adminAdjustSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { userId, adjustmentType, amount, reason } = parsed.data;

  const ledgerType = adjustmentType === "CREDIT" ? "ADMIN_CREDIT" : adjustmentType === "DEBIT" ? "ADMIN_DEBIT" : "BALANCE_CORRECTION";

  let entryId: string;
  if (adjustmentType === "DEBIT") {
    entryId = await debitPortfolio({
      userId,
      amount,
      transactionType: ledgerType as any,
      referenceType: "AdminAdjustment",
      notes: reason,
      createdBy: session.user.id,
    });
  } else {
    entryId = await creditPortfolio({
      userId,
      amount,
      transactionType: ledgerType as any,
      referenceType: "AdminAdjustment",
      notes: reason,
      createdBy: session.user.id,
    });
  }

  // Record balance adjustment
  const portfolio = await prisma.divaPortfolio.findUnique({ where: { userId } });
  if (portfolio) {
    await prisma.divaBalanceAdjustment.create({
      data: {
        portfolioId: portfolio.id,
        userId,
        adjustmentType,
        amount,
        reason,
        createdBy: session.user.id,
        ledgerEntryId: entryId,
      },
    });
  }

  // Notify user
  await createNotification({
    userId,
    title: adjustmentType === "CREDIT" ? "Balance Credited 💰" : adjustmentType === "DEBIT" ? "Balance Debited" : "Balance Corrected",
    message: `Admin ${adjustmentType.toLowerCase()}ed ${amount} to your account. Reason: ${reason}`,
    type: adjustmentType === "CREDIT" ? "success" : "info",
    link: "/diva-app/portfolio",
  });

  await writeAuditLog({
    action: "DEPOSIT_APPROVED" as any,
    entityType: "DivaPortfolio",
    entityId: portfolio?.id,
    performedBy: session.user.id,
    ipAddress: await getIp(),
    metadata: { adjustmentType, amount, userId, reason } as any,
  });

  revalidatePath(`/diva-app-admin/portfolio/${userId}`);
  revalidatePath("/diva-app/portfolio");
  return { success: true, entryId };
}

// ─── Admin: Change portfolio status ───────────────────────────────────────────
export async function adminSetPortfolioStatus(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) return { error: "Unauthorized" };

  const parsed = adminStatusSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { userId, status, reason } = parsed.data;

  const portfolio = await prisma.divaPortfolio.findUnique({ where: { userId } });
  if (!portfolio) return { error: "Portfolio not found" };

  await prisma.divaPortfolio.update({
    where: { userId },
    data: { status },
  });

  await prisma.divaPortfolioEvent.create({
    data: {
      portfolioId: portfolio.id,
      userId,
      eventType: "STATUS_CHANGED",
      eventDescription: `Status changed to ${status}. Reason: ${reason}`,
      metadata: { from: portfolio.status, to: status, reason } as any,
    },
  });

  await createNotification({
    userId,
    title: `Account ${status}`,
    message: `Your account status has been changed to ${status}. ${reason}`,
    type: status === "ACTIVE" ? "success" : "warning",
    link: "/diva-app/portfolio",
  });

  await writeAuditLog({
    action: "WALLET_UPDATED" as any,
    entityType: "DivaPortfolio",
    entityId: portfolio.id,
    performedBy: session.user.id,
    ipAddress: await getIp(),
    metadata: { status, userId, reason } as any,
  });

  revalidatePath(`/diva-app-admin/portfolio/${userId}`);
  revalidatePath("/diva-app-admin/portfolio");
  return { success: true };
}

// ─── Admin: Platform analytics ────────────────────────────────────────────────
export async function adminPortfolioStats() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) return { error: "Unauthorized" };

  const [
    totalUsers,
    activePortfolios,
    balanceAgg,
    depositAgg,
    adjustAgg,
    pendingDeposits,
    recentLedger,
  ] = await Promise.all([
    prisma.divaPortfolio.count(),
    prisma.divaPortfolio.count({ where: { status: "ACTIVE" } }),
    prisma.divaPortfolio.aggregate({ _sum: { currentBalance: true } }),
    prisma.divaLedgerEntry.aggregate({
      where: { transactionType: "DEPOSIT_CREDIT" },
      _sum: { amount: true },
    }),
    prisma.divaLedgerEntry.aggregate({
      where: { transactionType: { in: ["ADMIN_CREDIT", "ADMIN_DEBIT", "BALANCE_CORRECTION"] } },
      _sum: { amount: true },
    }),
    prisma.divaDeposit.count({ where: { status: "PENDING" } }),
    prisma.divaLedgerEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { createdAt: true, newBalance: true, transactionType: true, amount: true, userId: true },
    }),
  ]);

  // Build balance trend for last 14 days
  const since = new Date();
  since.setDate(since.getDate() - 14);
  const trendMap = new Map<string, { credits: number; debits: number }>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    trendMap.set(d.toISOString().slice(0, 10), { credits: 0, debits: 0 });
  }
  for (const e of recentLedger) {
    const d = e.createdAt.toISOString().slice(0, 10);
    if (trendMap.has(d)) {
      const v = trendMap.get(d)!;
      const amt = Math.abs(Number(e.amount));
      if (Number(e.amount) > 0) v.credits += amt;
      else v.debits += amt;
    }
  }
  const trend = Array.from(trendMap.entries()).map(([date, v]) => ({ date, ...v }));

  return {
    totalUsers,
    activePortfolios,
    totalPlatformBalance: balanceAgg._sum.currentBalance?.toString() ?? "0",
    totalDeposited: depositAgg._sum.amount?.toString() ?? "0",
    totalAdjusted: adjustAgg._sum.amount?.toString() ?? "0",
    pendingDeposits,
    trend,
  };
}
