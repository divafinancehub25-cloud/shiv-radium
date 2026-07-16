export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Global font library stored in Setting (key: font_library) — shared by all
// templates/products. Each entry: { label, family, url?, dataUrl? }

const KEY = "font_library";

async function readLibrary(): Promise<unknown[]> {
  const row = await db.setting.findUnique({ where: { key: KEY } });
  if (!row) return [];
  try { return JSON.parse(row.value); } catch { return []; }
}

export async function GET() {
  try {
    return NextResponse.json({ fonts: await readLibrary() });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { font } = await req.json();
    if (!font?.family || !font?.label) return NextResponse.json({ error: "font.label & font.family required" }, { status: 400 });
    const fonts = (await readLibrary()) as { family: string }[];
    if (!fonts.some((f) => f.family === font.family)) fonts.push(font);
    await db.setting.upsert({
      where: { key: KEY },
      update: { value: JSON.stringify(fonts) },
      create: { key: KEY, value: JSON.stringify(fonts) },
    });
    return NextResponse.json({ fonts });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { family } = await req.json();
    const fonts = ((await readLibrary()) as { family: string }[]).filter((f) => f.family !== family);
    await db.setting.upsert({
      where: { key: KEY },
      update: { value: JSON.stringify(fonts) },
      create: { key: KEY, value: JSON.stringify(fonts) },
    });
    return NextResponse.json({ fonts });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
