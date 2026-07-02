import { z } from "zod";

export const createDriverSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  licenseNo: z.string().min(5, "License number is required"),
  licenseExp: z.string().datetime(),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const updateDriverSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/)
    .optional(),
  licenseNo: z.string().min(5).optional(),
  licenseExp: z.string().datetime().optional(),
  isAvailable: z.boolean().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
