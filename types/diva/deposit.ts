import type {
  DivaDepositWallet,
  DivaDeposit,
  DivaAuditLog,
  DivaNotification,
  DivaWalletStatus,
  DivaDepositStatus,
  User,
} from "@prisma/client";

// ── Wallet ────────────────────────────────────────────────────────────────────
export type WalletRow = DivaDepositWallet & {
  creator: Pick<User, "id" | "name" | "email">;
  _count?: { deposits: number };
};

export type CreateWalletInput = {
  walletName: string;
  coinType: string;
  network: string;
  address: string;
  qrImageUrl?: string;
  instructions?: string;
  sortOrder?: number;
};

export type UpdateWalletInput = Partial<CreateWalletInput> & {
  status?: DivaWalletStatus;
};

// ── Deposit ───────────────────────────────────────────────────────────────────
export type DepositRow = DivaDeposit & {
  user: Pick<User, "id" | "name" | "email">;
  wallet: Pick<DivaDepositWallet, "id" | "walletName" | "coinType" | "network" | "address">;
  reviewer?: Pick<User, "id" | "name"> | null;
};

export type SubmitDepositInput = {
  walletId: string;
  amount: number;
  transactionHash: string;
  proofImageUrl?: string;
  notes?: string;
};

// ── Audit ─────────────────────────────────────────────────────────────────────
export type AuditRow = DivaAuditLog & {
  actor?: Pick<User, "id" | "name" | "email"> | null;
};

// ── Notification ──────────────────────────────────────────────────────────────
export type NotificationRow = DivaNotification;

// ── Stats ─────────────────────────────────────────────────────────────────────
export type DepositStats = {
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  totalVolume: string; // formatted decimal string
};

export type NetworkDistribution = { network: string; count: number }[];
export type StatusBreakdown = { status: DivaDepositStatus; count: number }[];
export type DailyActivity = { date: string; count: number; volume: number }[];
