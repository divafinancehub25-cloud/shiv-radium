import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, paymentStatus, courierName, trackingNumber } = await req.json();

  try {
    const order = await db.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
        ...(courierName !== undefined && { courierName: courierName || null }),
        ...(trackingNumber !== undefined && { trackingNumber: trackingNumber || null }),
      },
    });
    return NextResponse.json({ orderId: order.id, status: order.status });
  } catch {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
