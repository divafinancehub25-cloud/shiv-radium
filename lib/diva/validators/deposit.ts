import { z } from "zod";

export const createWalletSchema = z.object({
  walletName: z.string().min(2, "Wallet name too short").max(80),
  coinType: z.string().min(1, "Coin type required"),
  network: z.string().min(1, "Network required"),
  address: z.string().min(10, "Address too short").max(255),
  qrImageUrl: z.string().url().optional().or(z.literal("")),
  instructions: z.string().max(2000).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional().default(0),
});

export const updateWalletSchema = createWalletSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const submitDepositSchema = z.object({
  walletId: z.string().cuid("Invalid wallet"),
  amount: z
    .number({ error: "Amount must be a valid number" })
    .positive("Amount must be positive")
    .max(10_000_000, "Amount exceeds limit"),
  transactionHash: z
    .string()
    .min(10, "Transaction hash too short")
    .max(255)
    .regex(/^[a-zA-Z0-9]+$/, "Hash must be alphanumeric"),
  proofImageUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().max(1000).optional(),
});

export const reviewDepositSchema = z.object({
  depositId: z.string().cuid(),
  action: z.enum(["UNDER_REVIEW", "APPROVED", "REJECTED"]),
  adminNotes: z.string().max(2000).optional(),
}).refine(
  (d) => d.action !== "REJECTED" || (d.adminNotes && d.adminNotes.trim().length > 0),
  { message: "Admin notes are required when rejecting", path: ["adminNotes"] }
);

export type CreateWalletInput = z.infer<typeof createWalletSchema>;
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;
export type SubmitDepositInput = z.infer<typeof submitDepositSchema>;
export type ReviewDepositInput = z.infer<typeof reviewDepositSchema>;
