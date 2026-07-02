import { z } from "zod";
import { ServiceType, PackageType } from "@prisma/client";

export const createBookingSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email"),
  customerPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
  serviceType: z.nativeEnum(ServiceType),
  packageType: z.nativeEnum(PackageType),
  pickupCity: z.string().min(1, "Pickup city is required"),
  dropCity: z.string().optional(),
  pickupAddress: z.string().min(5, "Pickup address is required"),
  dropAddress: z.string().optional(),
  pickupDateTime: z.string().datetime(),
  returnDateTime: z.string().datetime().optional(),
  estimatedKm: z.number().int().positive().optional(),
  specialNotes: z.string().max(500).optional(),
});

export const updateBookingStatusSchema = z.object({
  bookingId: z.string().cuid(),
  status: z.enum([
    "CONFIRMED",
    "VEHICLE_ASSIGNED",
    "DRIVER_ASSIGNED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "REFUNDED",
  ]),
  note: z.string().optional(),
});

export const assignVehicleSchema = z.object({
  bookingId: z.string().cuid(),
  vehicleId: z.string().cuid(),
});

export const assignDriverSchema = z.object({
  bookingId: z.string().cuid(),
  driverId: z.string().cuid(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
