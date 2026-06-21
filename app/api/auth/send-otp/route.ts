export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  if (!phone || phone.length !== 10) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await db.otpToken.create({ data: { phone, otp, expiresAt } });

  // TODO: Send OTP via SMS (Twilio/MSG91). For now log to console.
  console.log(`OTP for ${phone}: ${otp}`);

  return NextResponse.json({ success: true, message: "OTP sent" });
}
