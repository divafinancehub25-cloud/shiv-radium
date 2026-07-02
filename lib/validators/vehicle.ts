import { z } from "zod";
import { VehicleStatus } from "@prisma/client";

export const createVehicleSchema = z.object({
  model: z.string().min(2, "Model is required"),
  year: z.number().int().min(2000).max(new Date().getFullYear() + 1),
  registration: z
    .string()
    .regex(/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/, "Invalid registration number"),
  color: z.string().min(1, "Color is required"),
  features: z.array(z.string()).default([]),
  description: z.string().max(1000).optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  status: z.nativeEnum(VehicleStatus).optional(),
  isActive: z.boolean().optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
