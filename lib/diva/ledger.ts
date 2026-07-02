"use server";
/**
 * Immutable Ledger Engine — all writes go through these functions.
 * Ledger entries are NEVER deleted or updated.
 */
import { prisma } from "@/lib/prisma";
import type { DivaLedgerType, DivaPortfolioEventType, Prisma } from "@prisma/client";

export type LedgerCreditInput = {
  userId: string;
  amount: number | string;
  transactionType: DivaLedgerType;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdBy?: string;
  /** If provided, runs inside this transaction */
  tx?: Omit<Prisma.TransactionClient, "$disconnect" | "$connect" | "$on" | "$transaction" | "$extends">;
};

async function _ensurePortfolio(
  userId: string,
  tx: Omit<Prisma.TransactionClient, "$disconnect" | "$connect" | "$on" | "$transaction" | "$extends">
) {
  let portfolio = await tx.divaPortfolio.findUnique({ where: { userId } });
  if (!portfolio) {
    portfolio = await tx.divaPortfolio.create({
      data: {
        userId,
        currentBalance: 0,
        availableBalance: 0,
        lockedBalance: 0,
        status: "ACTIVE",
      },
    });
    // Create portfolio-created event
    await tx.divaPortfolioEvent.create({
      data: {
        portfolioId: portfolio.id,
        userId,
        eventType: "PORTFOLIO_CREATED",
        eventDescription: "Portfolio account created",
      },
    });
  }
  return portfolio;
}

/** Credit (add) amount to a user portfolio. Returns the new ledger entry id. */
export async function creditPortfolio({
  userId,
  amount,
  transactionType,
  referenceType,
  referenceId,
  notes,
  createdBy,
  tx,
}: LedgerCreditInput): Promise<string> {
  const run = async (
    client: Omit<Prisma.TransactionClient, "$disconnect" | "$connect" | "$on" | "$transaction" | "$extends">
  ) => {
    const portfolio = await _ensurePortfolio(userId, client);
    const previous = Number(portfolio.currentBalance);
    const delta = Number(amount);
    const next = previous + delta;

    // Update portfolio balances
    await client.divaPortfolio.update({
      where: { id: portfolio.id },
      data: {
        currentBalance: next,
        availableBalance: { increment: delta },
        updatedAt: new Date(),
      },
    });

    // Immutable ledger entry
    const entry = await client.divaLedgerEntry.create({
      data: {
        portfolioId: portfolio.id,
        userId,
        transactionType,
        amount: delta,
        previousBalance: previous,
        newBalance: next,
        referenceType,
        referenceId,
        notes,
        createdBy,
      },
    });

    // Portfolio event
    const eventTypeMap: Record<DivaLedgerType, DivaPortfolioEventType> = {
      DEPOSIT_CREDIT: "DEPOSIT_CREDITED",
      ADMIN_CREDIT: "ADMIN_CREDIT",
      ADMIN_DEBIT: "ADMIN_DEBIT",
      BALANCE_CORRECTION: "BALANCE_CORRECTION",
      SYSTEM_ADJUSTMENT: "SYSTEM_ADJUSTMENT",
    };
    await client.divaPortfolioEvent.create({
      data: {
        portfolioId: portfolio.id,
        userId,
        eventType: eventTypeMap[transactionType],
        eventDescription: notes ?? `${transactionType} of ${delta}`,
        metadata: { amount: delta, entryId: entry.id } as any,
      },
    });

    return entry.id;
  };

  if (tx) return run(tx);
  return prisma.$transaction(run);
}

/** Debit (subtract) amount from a user portfolio. Returns the new ledger entry id. */
export async function debitPortfolio({
  userId,
  amount,
  transactionType,
  referenceType,
  referenceId,
  notes,
  createdBy,
  tx,
}: LedgerCreditInput): Promise<string> {
  const run = async (
    client: Omit<Prisma.TransactionClient, "$disconnect" | "$connect" | "$on" | "$transaction" | "$extends">
  ) => {
    const portfolio = await _ensurePortfolio(userId, client);
    const previous = Number(portfolio.currentBalance);
    const delta = Math.abs(Number(amount));
    const next = Math.max(0, previous - delta);

    await client.divaPortfolio.update({
      where: { id: portfolio.id },
      data: {
        currentBalance: next,
        availableBalance: next,
        updatedAt: new Date(),
      },
    });

    const entry = await client.divaLedgerEntry.create({
      data: {
        portfolioId: portfolio.id,
        userId,
        transactionType,
        amount: -delta,
        previousBalance: previous,
        newBalance: next,
        referenceType,
        referenceId,
        notes,
        createdBy,
      },
    });

    await client.divaPortfolioEvent.create({
      data: {
        portfolioId: portfolio.id,
        userId,
        eventType: "ADMIN_DEBIT",
        eventDescription: notes ?? `DEBIT of ${delta}`,
        metadata: { amount: delta, entryId: entry.id } as any,
      },
    });

    return entry.id;
  };

  if (tx) return run(tx);
  return prisma.$transaction(run);
}
