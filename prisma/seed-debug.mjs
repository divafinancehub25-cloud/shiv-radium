// Plain ESM seed — no TypeScript, no dotenvx interference
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Manually load .env BEFORE any other imports that might use env vars
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env");
try {
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val; // always set, even if already defined
  }
  console.log("✓ .env loaded, DATABASE_URL length:", process.env.DATABASE_URL?.length ?? 0);
} catch (e) {
  console.error("❌ Could not read .env:", e.message);
  process.exit(1);
}

import { neon } from "@neondatabase/serverless";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

console.log("Connecting to Neon database…");
const sql = neon(DB_URL);
const adapter = new PrismaNeonHttp(sql);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database…\n");

  // Super Admin
  const superAdminHash = await bcrypt.hash("Admin@123", 10);
  await prisma.user.upsert({
    where: { email: "superadmin@bmwrental.in" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@bmwrental.in",
      phone: "9999999999",
      passwordHash: superAdminHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log("✓ Super Admin");

  // Admin
  const adminHash = await bcrypt.hash("Admin@123", 10);
  await prisma.user.upsert({
    where: { email: "admin@bmwrental.in" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@bmwrental.in",
      phone: "9888888888",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  console.log("✓ Admin");

  // Pricing rules
  for (const rule of [
    { packageType: "TRANSFER", basePrice: 4000, includedKm: 25, extraKmRate: 20 },
    { packageType: "LOCAL", basePrice: 5000, includedKm: 40, includedHours: 4, extraKmRate: 20, extraHourRate: 500 },
    { packageType: "FULL_DAY", basePrice: 9600, includedKm: 80, includedHours: 8, extraKmRate: 20, extraHourRate: 800 },
    { packageType: "OUTSTATION", basePrice: 0, includedKm: 0, extraKmRate: 0, ratePerKm: 50, minKm: 250, nightCharge: 300, driverAllowance: 500 },
  ]) {
    await prisma.pricingRule.upsert({
      where: { packageType: rule.packageType },
      update: {},
      create: rule,
    });
  }
  console.log("✓ Pricing rules (4 packages)");

  // Sample vehicles
  for (const v of [
    { model: "BMW 7 Series", year: 2023, registration: "RJ14AB1234", color: "Alpine White" },
    { model: "BMW 5 Series", year: 2022, registration: "RJ14CD5678", color: "Sophisto Grey" },
    { model: "BMW X5", year: 2023, registration: "RJ14EF9012", color: "Carbon Black" },
  ]) {
    await prisma.vehicle.upsert({
      where: { registration: v.registration },
      update: {},
      create: { ...v, features: ["Leather Seats", "Sunroof", "GPS Navigation", "Wi-Fi"] },
    });
  }
  console.log("✓ 3 BMW vehicles");

  // Settings
  for (const s of [
    { key: "company_name", value: "BMW Rental Rajasthan", type: "string", description: "Company display name" },
    { key: "company_phone", value: "+91-9876543210", type: "string", description: "Primary contact" },
    { key: "company_email", value: "info@bmwrental.in", type: "string", description: "Primary email" },
    { key: "gst_number", value: "", type: "string", description: "GST number" },
    { key: "gst_rate", value: "0", type: "number", description: "GST rate %" },
    { key: "advance_percentage", value: "30", type: "number", description: "Advance payment %" },
  ]) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s });
  }
  console.log("✓ Settings");

  await prisma.$disconnect();

  console.log("\n🎉 Seed complete!");
  console.log("──────────────────────────────────────────────────");
  console.log("  Super Admin : superadmin@bmwrental.in");
  console.log("  Admin       : admin@bmwrental.in");
  console.log("  Password    : Admin@123");
  console.log("──────────────────────────────────────────────────");
  console.log("  → Open: http://localhost:3000/admin/dashboard\n");
}

main().catch((e) => {
  console.error("\n❌ Seed failed:", e.message);
  console.error(e.stack);
  process.exit(1);
});
