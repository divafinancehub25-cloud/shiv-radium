export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// List templates for a product
export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get("productId");
    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
    const templates = await db.frameTemplate.findMany({
      where: { productId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ templates });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// Create a template
export async function POST(req: NextRequest) {
  try {
    const { productId, name, elements, bgImage } = await req.json();
    if (!productId || !name) return NextResponse.json({ error: "productId & name required" }, { status: 400 });
    const template = await db.frameTemplate.create({
      data: {
        productId,
        name,
        elements: elements ?? [],
        bgImage: bgImage ?? null,
      },
    });
    return NextResponse.json({ template });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
