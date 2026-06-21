export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const { phone, otp } = await req.json();

  const token = await db.otpToken.findFirst({
    where: { phone, otp, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!token) {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
  }

  await db.otpToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });

  let user = await db.user.findUnique({ where: { phone } });
  if (!user) {
    user = await db.user.create({ data: { phone, role: "CUSTOMER" } });
  }

  const cookieStore = await cookies();
  cookieStore.set("user_id", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return NextResponse.json({ success: true, userId: user.id });
}
