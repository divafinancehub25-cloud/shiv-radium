import { z } from "zod";

const NETWORKS = ["TRC20", "ERC20", "BEP20", "BTC", "SOL"] as const;

// Per-network wallet address format checks (lightweight, not full checksum validation)
const ADDRESS_PATTERNS: Record<(typeof NETWORKS)[number], RegExp> = {
  TRC20: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
  ERC20: /^0x[a-fA-F0-9]{40}$/,
  BEP20: /^0x[a-fA-F0-9]{40}$/,
  BTC: /^(bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
  SOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
};

export const createWithdrawalSchema = z
  .object({
    amount: z
      .number({ error: "Amount must be a valid number" })
      .positive("Amount must be positive")
      .max(10_000_000, "Amount exceeds limit"),
    walletAddress: z.string().min(20, "Wallet address too short").max(120, "Wallet address too long"),
    network: z.enum(NETWORKS, { error: "Select a valid network" }),
    userNotes: z.string().max(1000).optional(),
  })
  .refine((d) => ADDRESS_PATTERNS[d.network].test(d.walletAddress.trim()), {
    message: "Wallet address format does not match the selected network",
    path: ["walletAddress"],
  });

export const reviewWithdrawalSchema = z
  .object({
    withdrawalId: z.string().cuid(),
    action: z.enum(["UNDER_REVIEW", "APPROVED", "REJECTED"]),
    adminNotes: z.string().max(2000).optional(),
  })
  .refine((d) => d.action !== "REJECTED" || (d.adminNotes && d.adminNotes.trim().length > 0), {
    message: "Admin notes are required when rejecting",
    path: ["adminNotes"],
  });

export const cancelWithdrawalSchema = z.object({
  withdrawalId: z.string().cuid(),
});

export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
export type ReviewWithdrawalInput = z.infer<typeof reviewWithdrawalSchema>;
export type CancelWithdrawalInput = z.infer<typeof cancelWithdrawalSchema>;
