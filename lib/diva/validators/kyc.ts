import { z } from "zod";

export const kycStep1Schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  nationality: z.string().min(2, "Nationality is required"),
  address: z.string().min(5, "Address is required"),
});

export const kycStep2Schema = z.object({
  documentType: z.enum(["PASSPORT", "NATIONAL_ID", "DRIVING_LICENSE"]),
  documentUrl: z.string().url("Invalid document URL"),
  fileName: z.string().min(1),
});

export const kycStep3Schema = z.object({
  selfieUrl: z.string().url("Invalid selfie URL"),
  fileName: z.string().min(1),
});

export type KYCStep1Input = z.infer<typeof kycStep1Schema>;
export type KYCStep2Input = z.infer<typeof kycStep2Schema>;
export type KYCStep3Input = z.infer<typeof kycStep3Schema>;
