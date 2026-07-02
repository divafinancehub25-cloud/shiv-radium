import { NextRequest, NextResponse } from "next/server";
import { verifyEmail } from "@/actions/diva/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/verify-email/invalid", req.url));
  }
  const result = await verifyEmail(token);
  if (result.error) {
    return NextResponse.redirect(new URL(`/verify-email/error?msg=${encodeURIComponent(result.error)}`, req.url));
  }
  return NextResponse.redirect(new URL("/login?verified=1", req.url));
}
