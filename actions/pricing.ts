"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getPricingRules() {
  const rules = await prisma.pricingRule.findMany({
    orderBy: { packageType: "asc" },
  });
  return { rules };
}

export async function updatePricingRule(
  id: string,
  data: {
    basePrice?: number;
    includedKm?: number;
    includedHours?: number;
    extraKmRate?: number;
    extraHourRate?: number;
    nightCharge?: number;
    driverAllowance?: number;
    minKm?: number;
    ratePerKm?: number;
  }
) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const rule = await prisma.pricingRule.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/pricing");
  return { success: true, rule };
}

export async function seedDefaultPricing() {
  const existing = await prisma.pricingRule.count();
  if (existing > 0) return { skipped: true };

  await prisma.pricingRule.createMany({
    data: [
      {
        packageType: "TRANSFER",
        basePrice: 4000,
        includedKm: 25,
        extraKmRate: 20,
      },
      {
        packageType: "LOCAL",
        basePrice: 5000,
        includedKm: 40,
        includedHours: 4,
        extraKmRate: 20,
        extraHourRate: 500,
      },
      {
        packageType: "FULL_DAY",
        basePrice: 9600,
        includedKm: 80,
        includedHours: 8,
        extraKmRate: 20,
        extraHourRate: 800,
      },
      {
        packageType: "OUTSTATION",
        basePrice: 0,
        includedKm: 0,
        extraKmRate: 0,
        ratePerKm: 50,
        minKm: 250,
        nightCharge: 300,
        driverAllowance: 500,
      },
    ],
  });

  return { success: true };
}
