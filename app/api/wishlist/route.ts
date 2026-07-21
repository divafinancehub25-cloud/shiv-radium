export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

async function currentUserId(): Promise<string | null> {
  const store = await cookies();
  return store.get("user_id")?.value ?? null;
}

// List the logged-in customer's liked product ids
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ productIds: [], loggedIn: false });
  const rows = await db.wishlist.findMany({ where: { userId }, select: { productId: true } });
  return NextResponse.json({ productIds: rows.map((r) => r.productId), loggedIn: true });
}

// Toggle like/unlike
export async function POST(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Login karo", loggedIn: false }, { status: 401 });
  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const existing = await db.wishlist.findFirst({ where: { userId, productId } });
  if (existing) {
    await db.wishlist.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }
  await db.wishlist.create({ data: { userId, productId } });
  return NextResponse.json({ liked: true });
}
