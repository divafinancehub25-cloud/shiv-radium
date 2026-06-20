import { PackageType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PriceBreakdown = {
  baseAmount: number;
  extraKmCharge: number;
  extraHourCharge: number;
  nightCharge: number;
  driverAllowance: number;
  totalAmount: number;
  breakdown: string[];
};

export async function calculatePrice({
  packageType,
  actualKm,
  actualHours,
  nights = 0,
  days = 1,
}: {
  packageType: PackageType;
  actualKm?: number;
  actualHours?: number;
  nights?: number;
  days?: number;
}): Promise<PriceBreakdown> {
  const rule = await prisma.pricingRule.findUnique({
    where: { packageType },
  });

  if (!rule) throw new Error(`Pricing rule not found for ${packageType}`);

  const base = Number(rule.basePrice);
  const breakdown: string[] = [`Base price: ₹${base}`];
  let extraKm = 0;
  let extraHour = 0;
  let night = 0;
  let allowance = 0;

  if (packageType === PackageType.OUTSTATION) {
    const km = actualKm ?? rule.minKm ?? 250;
    const total = km * Number(rule.ratePerKm ?? 50);
    night = nights * Number(rule.nightCharge ?? 300);
    allowance = days * Number(rule.driverAllowance ?? 500);
    breakdown.push(`${km} km × ₹${rule.ratePerKm}/km = ₹${total}`);
    if (night > 0) breakdown.push(`Night charges: ₹${night}`);
    if (allowance > 0) breakdown.push(`Driver allowance: ₹${allowance}`);
    const totalAmount = total + night + allowance;
    return { baseAmount: total, extraKmCharge: 0, extraHourCharge: 0, nightCharge: night, driverAllowance: allowance, totalAmount, breakdown };
  }

  if (actualKm && actualKm > rule.includedKm) {
    const extra = actualKm - rule.includedKm;
    extraKm = extra * Number(rule.extraKmRate);
    breakdown.push(`Extra ${extra} km × ₹${rule.extraKmRate} = ₹${extraKm}`);
  }

  if (rule.includedHours && actualHours && actualHours > rule.includedHours) {
    const extra = actualHours - rule.includedHours;
    extraHour = extra * Number(rule.extraHourRate ?? 0);
    breakdown.push(`Extra ${extra} hrs × ₹${rule.extraHourRate} = ₹${extraHour}`);
  }

  const totalAmount = base + extraKm + extraHour;
  return { baseAmount: base, extraKmCharge: extraKm, extraHourCharge: extraHour, nightCharge: 0, driverAllowance: 0, totalAmount, breakdown };
}
