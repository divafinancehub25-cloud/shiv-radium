export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mime = file.type;

  // Upload to ImgBB (free, no account needed for basic)
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    // Fallback: return base64 data URL (works but large)
    return NextResponse.json({ url: `data:${mime};base64,${base64}` });
  }

  const body = new URLSearchParams();
  body.append("key", apiKey);
  body.append("image", base64);

  const res = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body });
  const data = await res.json();

  if (data.success) {
    return NextResponse.json({ url: data.data.url });
  }
  return NextResponse.json({ error: "Upload failed" }, { status: 500 });
}
