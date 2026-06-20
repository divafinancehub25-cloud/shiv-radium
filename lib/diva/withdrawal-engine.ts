"use server";
/**
 * Withdrawal Balance Engine — handles locking, unlocking, and settling funds
 * against the Portfolio Engine (Phase 3). All mutations run inside a Prisma
 * transaction and write immutable ledger + portfolio-event records.
 *
 * Balance model:
 *   currentBalance   = total owned (available + locked)
 *   availableBalance = freely withdrawable
 *   lockedBalance    = reserved against pending withdrawals
 *
 * Flow:
 *   SUBMIT  → lockFunds()    available -= amt, locked += amt   (currentBalance unchanged)
 *   REJECT  → unlockFunds()  available += amt, locked -= amt
 *   CANCEL  → unlockFunds()
 *   APPROVE → settleFunds()  current -= amt, locked -= amt + immutable ledger debit
 */
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type Tx = Omit<Prisma.TransactionClient, "$disconnect" | "$connect" | "$on" | "$transaction" | "$extends">;

/** Reserve funds for a pending withdrawal. Throws if insufficient available balance. */
export async function lockFunds(client: Tx, userId: string, amount: number) {
  const portfolio = await client.divaPortfolio.findUnique({ where: { userId } });
  if (!portfolio) throw new Error("No portfolio found");

  const available = Number(portfolio.availableBalance);
  if (amount > available) throw new Error("Insufficient available balance");

  await client.divaPortfolio.update({
    where: { id: portfolio.id },
    data: {
      availableBalance: { decrement: amount },
      lockedBalance: { increment: amount },
      updatedAt: new Date(),
    },
  });

  await client.divaPortfolioEvent.create({
    data: {
      portfolioId: portfolio.id,
      userId,
      eventType: "SYSTEM_ADJUSTMENT",
      eventDescription: `Locked ${amount} for pending withdrawal`,
      metadata: { amount, kind: "LOCK" } as any,
    },
  });

  return portfolio;
}

/** Release previously-reserved funds back to available (reject / cancel). */
export async function unlockFunds(client: Tx, userId: string, amount: number) {
  const portfolio = await client.divaPortfolio.findUnique({ where: { userId } });
  if (!portfolio) throw new Error("No portfolio found");

  const locked = Number(portfolio.lockedBalance);
  const release = Math.min(amount, locked); // never go negative

  await client.divaPortfolio.update({
    where: { id: portfolio.id },
    data: {
      availableBalance: { increment: release },
      lockedBalance: { decrement: release },
      updatedAt: new Date(),
    },
  });

  await client.divaPortfolioEvent.create({
    data: {
      portfolioId: portfolio.id,
      userId,
      eventType: "SYSTEM_ADJUSTMENT",
      eventDescription: `Released ${release} from a withdrawal`,
      metadata: { amount: release, kind: "UNLOCK" } as any,
    },
  });

  return portfolio;
}

/**
 * Settle an approved withdrawal: remove the amount permanently from the
 * portfolio (current & locked) and write an immutable ledger debit entry.
 * Returns the new ledger entry id.
 */
export async function settleFunds(
  client: Tx,
  userId: string,
  amount: number,
  withdrawalId: string,
  createdBy: string
): Promise<string> {
  const portfolio = await client.divaPortfolio.findUnique({ where: { userId } });
  if (!portfolio) throw new Error("No portfolio found");

  const previous = Number(portfolio.currentBalance);
  const locked = Number(portfolio.lockedBalance);
  const settle = Math.min(amount, locked > 0 ? locked : amount);
  const next = Math.max(0, previous - settle);

  await client.divaPortfolio.update({
    where: { id: portfolio.id },
    data: {
      currentBalance: next,
      lockedBalance: { decrement: settle },
      updatedAt: new Date(),
    },
  });

  const entry = await client.divaLedgerEntry.create({
    data: {
      portfolioId: portfolio.id,
      userId,
      transactionType: "ADMIN_DEBIT",
      amount: -settle,
      previousBalance: previous,
      newBalance: next,
      referenceType: "DivaWithdrawal",
      referenceId: withdrawalId,
      notes: `Withdrawal approved & settled (${settle})`,
      createdBy,
    },
  });

  await client.divaPortfolioEvent.create({
    data: {
      portfolioId: portfolio.id,
      userId,
      eventType: "ADMIN_DEBIT",
      eventDescription: `Withdrawal settled — ${settle} debited`,
      metadata: { amount: settle, entryId: entry.id, withdrawalId } as any,
    },
  });

  return entry.id;
}
