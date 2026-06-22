export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  if (!phone || phone.length !== 10) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.otpToken.create({ data: { phone, otp, expiresAt } });

  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = "6a390567fa7d9069790f1063";

  if (authKey) {
    await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json", "authkey": authKey },
      body: JSON.stringify({
        template_id: templateId,
        mobile: `91${phone}`,
        otp,
      }),
    });
  }

  return NextResponse.json({ success: true, message: "OTP sent" });
}
