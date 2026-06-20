import { z } from "zod";

export const adminAdjustSchema = z.object({
  userId: z.string().cuid("Invalid user"),
  adjustmentType: z.enum(["CREDIT", "DEBIT", "CORRECTION"]),
  amount: z
    .number({ error: "Amount must be a valid number" })
    .positive("Amount must be positive")
    .max(100_000_000, "Amount exceeds limit"),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(1000),
});

export const adminStatusSchema = z.object({
  userId: z.string().cuid("Invalid user"),
  status: z.enum(["ACTIVE", "SUSPENDED", "FROZEN", "CLOSED"]),
  reason: z.string().min(5, "Reason required").max(500),
});

export const ledgerQuerySchema = z.object({
  userId: z.string().cuid().optional(),
  type: z.enum(["DEPOSIT_CREDIT", "ADMIN_CREDIT", "ADMIN_DEBIT", "BALANCE_CORRECTION", "SYSTEM_ADJUSTMENT"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type AdminAdjustInput = z.infer<typeof adminAdjustSchema>;
export type AdminStatusInput = z.infer<typeof adminStatusSchema>;
export type LedgerQueryInput = z.infer<typeof ledgerQuerySchema>;
