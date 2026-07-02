import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.DATABASE_URL!;
const adapter = new PrismaNeonHttp(url, {});
const db = new PrismaClient({ adapter });

async function main() {
  const email = "kewatsiddhant01@gmail.com";
  const password = "Sidd1213@";
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await db.user.findFirst({ where: { email } });
  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: { passwordHash, role: "SUPER_ADMIN", isActive: true },
    });
    console.log("Admin updated:", email);
  } else {
    await db.user.create({
      data: { email, phone: "0000000000", passwordHash, role: "SUPER_ADMIN", isActive: true },
    });
    console.log("Admin created:", email);
  }
  await db.$disconnect();
}

main().catch(console.error);
