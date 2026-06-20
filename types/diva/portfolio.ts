import type {
  DivaPortfolio,
  DivaLedgerEntry,
  DivaPortfolioEvent,
  DivaBalanceAdjustment,
  DivaPortfolioStatus,
  DivaLedgerType,
  DivaPortfolioEventType,
  DivaAdjustmentType,
  User,
} from "@prisma/client";

export type { DivaPortfolioStatus, DivaLedgerType, DivaPortfolioEventType, DivaAdjustmentType };

// ─── Portfolio ────────────────────────────────────────────────────────────────

export type PortfolioRow = DivaPortfolio & {
  user: Pick<User, "id" | "name" | "email">;
  _count?: { ledgerEntries: number };
};

export type UserPortfolio = {
  id: string;
  currentBalance: string;
  availableBalance: string;
  lockedBalance: string;
  status: DivaPortfolioStatus;
  createdAt: Date;
  updatedAt: Date;
};

// ─── Ledger ───────────────────────────────────────────────────────────────────

export type LedgerRow = DivaLedgerEntry & {
  user: Pick<User, "id" | "name" | "email">;
  creator?: Pick<User, "id" | "name"> | null;
};

export type LedgerSummary = {
  transactionType: DivaLedgerType;
  _count: number;
  _sum: { amount: string | null };
};

// ─── Portfolio Events ─────────────────────────────────────────────────────────

export type PortfolioEventRow = DivaPortfolioEvent & {
  user: Pick<User, "id" | "name">;
};

// ─── Balance Adjustment ───────────────────────────────────────────────────────

export type AdjustmentRow = DivaBalanceAdjustment & {
  user: Pick<User, "id" | "name" | "email">;
  approver: Pick<User, "id" | "name">;
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export type BalanceTrendPoint = {
  date: string;
  balance: number;
  deposits: number;
  adjustments: number;
};

export type PortfolioStats = {
  totalUsers: number;
  activePortfolios: number;
  totalPlatformBalance: string;
  totalDeposited: string;
  totalAdjusted: string;
  pendingDeposits: number;
};

// ─── Admin Actions ────────────────────────────────────────────────────────────

export type AdminAdjustInput = {
  userId: string;
  adjustmentType: DivaAdjustmentType;
  amount: number;
  reason: string;
};

export type AdminStatusInput = {
  userId: string;
  status: DivaPortfolioStatus;
  reason: string;
};

// ─── CSV Export ───────────────────────────────────────────────────────────────

export type CsvLedgerRow = {
  date: string;
  type: string;
  amount: string;
  previousBalance: string;
  newBalance: string;
  reference: string;
  notes: string;
};
