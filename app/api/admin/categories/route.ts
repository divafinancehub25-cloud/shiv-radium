export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { name, slug, description, icon, sortOrder, isActive } = await req.json();
  if (!name || !slug) return NextResponse.json({ error: "Name and slug required" }, { status: 400 });
  try {
    const category = await db.category.create({
      data: { name, slug, description: description || null, icon: icon || null, sortOrder: Number(sortOrder) || 0, isActive },
    });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "Slug already exists or DB error" }, { status: 400 });
  }
}
