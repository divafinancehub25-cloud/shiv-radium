export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("order")?.trim();
  const phone = searchParams.get("phone")?.trim();

  if (!orderNumber) {
    return NextResponse.json({ error: "Order number required" }, { status: 400 });
  }

  const order = await db.order.findFirst({
    where: {
      orderNumber,
      ...(phone ? { customerPhone: phone } : {}),
    },
    include: { items: { select: { id: true, productName: true, quantity: true, totalPrice: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Order nahi mila. Number check karo." }, { status: 404 });
  }

  return NextResponse.json({ order });
}
