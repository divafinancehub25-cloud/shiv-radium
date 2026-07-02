import { z } from "zod";

export const createScenarioSchema = z.object({
  scenarioName: z.string().min(2, "Name too short").max(80),
  initialAmount: z.number({ error: "Enter a valid amount" }).min(0).max(100_000_000),
  contributionAmount: z.number({ error: "Enter a valid amount" }).min(0).max(10_000_000),
  contributionFreq: z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY"]).default("MONTHLY"),
  durationYears: z.number({ error: "Enter valid years" }).int().min(1).max(50),
  growthRate: z.number({ error: "Enter valid rate" }).min(0).max(100),
  compoundingFreq: z.enum(["DAILY", "MONTHLY", "QUARTERLY", "ANNUALLY"]).default("MONTHLY"),
  color: z.string().optional().default("#D4AF37"),
});

export const updateScenarioSchema = createScenarioSchema.partial().extend({
  id: z.string().cuid(),
  isPinned: z.boolean().optional(),
});

export const createMilestoneSchema = z.object({
  milestoneName: z.string().min(2, "Name too short").max(100),
  targetAmount: z.number({ error: "Enter a valid amount" }).positive().max(100_000_000),
  targetDate: z.string().datetime().optional().or(z.literal("")).transform(v => v || undefined),
  notes: z.string().max(500).optional(),
});

export const updateMilestoneSchema = createMilestoneSchema.partial().extend({
  id: z.string().cuid(),
  status: z.enum(["IN_PROGRESS", "ACHIEVED", "MISSED", "CANCELLED"]).optional(),
});

export type CreateScenarioInput = z.infer<typeof createScenarioSchema>;
export type UpdateScenarioInput = z.infer<typeof updateScenarioSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
