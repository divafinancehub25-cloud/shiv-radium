import type { DivaWithdrawalStatus, DivaWithdrawalNetwork } from "@prisma/client";

export type WithdrawalStatus = DivaWithdrawalStatus;
export type WithdrawalNetwork = DivaWithdrawalNetwork;

export type WithdrawalRow = {
  id: string;
  userId: string;
  amount: string | number;
  walletAddress: string;
  network: WithdrawalNetwork;
  status: WithdrawalStatus;
  userNotes: string | null;
  adminNotes: string | null;
  reviewedBy: string | null;
  submittedAt: string | Date;
  reviewedAt: string | Date | null;
  completedAt: string | Date | null;
  user?: { id: string; name: string | null; email: string | null };
  reviewer?: { id: string; name: string | null } | null;
};

export type WithdrawalStatusHistoryRow = {
  id: string;
  oldStatus: WithdrawalStatus | null;
  newStatus: WithdrawalStatus;
  changedBy: string | null;
  notes: string | null;
  createdAt: string | Date;
};

export type WithdrawalBalanceSummary = {
  currentBalance: number;
  availableBalance: number;
  lockedBalance: number;
  pendingCount: number;
  portfolioStatus: string;
};

export type AdminWithdrawalStats = {
  total: number;
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
  completed: number;
  cancelled: number;
  totalVolume: string;
  statusBreakdown: { status: string; count: number }[];
  dailyActivity: { date: string; count: number; volume: number }[];
};

export const WITHDRAWAL_NETWORKS: { value: WithdrawalNetwork; label: string }[] = [
  { value: "TRC20", label: "USDT — TRC20 (Tron)" },
  { value: "ERC20", label: "USDT — ERC20 (Ethereum)" },
  { value: "BEP20", label: "USDT — BEP20 (BSC)" },
  { value: "BTC", label: "Bitcoin" },
  { value: "SOL", label: "Solana" },
];
