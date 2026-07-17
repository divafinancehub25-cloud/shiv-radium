export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get("productId");
    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
    const reviews = await db.productReview.findMany({
      where: { productId, approved: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ reviews });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { productId, name, rating, text, images, videoUrl } = await req.json();
    if (!productId || !name || !rating) return NextResponse.json({ error: "Name aur rating zaroori hai" }, { status: 400 });
    const r = Math.max(1, Math.min(5, parseInt(rating)));
    const review = await db.productReview.create({
      data: {
        productId,
        name: String(name).slice(0, 60),
        rating: r,
        text: text ? String(text).slice(0, 1000) : null,
        images: Array.isArray(images) ? images.slice(0, 4) : [],
        videoUrl: videoUrl || null,
      },
    });
    return NextResponse.json({ review });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
