export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Update a template (name / elements / bgImage / isActive)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, elements, bgImage, isActive } = await req.json();
    const template = await db.frameTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(elements !== undefined ? { elements } : {}),
        ...(bgImage !== undefined ? { bgImage } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });
    return NextResponse.json({ template });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.frameTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
