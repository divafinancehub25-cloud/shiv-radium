export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, slug, description, icon, sortOrder, isActive } = await req.json();
  try {
    const category = await db.category.update({
      where: { id },
      data: { name, slug, description: description || null, icon: icon || null, sortOrder: Number(sortOrder) || 0, isActive },
    });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
