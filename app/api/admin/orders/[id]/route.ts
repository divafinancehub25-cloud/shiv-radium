import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
    const { status, paymentStatus, courierName, trackingNumber, gstNumber, gstRate } = await req.json();

  try {
    // Recompute GST amount from the order subtotal when a rate is provided
    let gstData = {};
    if (gstRate !== undefined || gstNumber !== undefined) {
      const existing = await db.order.findUnique({ where: { id }, select: { subtotal: true } });
      const rate = gstRate ? parseFloat(gstRate) : 0;
      const base = existing ? Number(existing.subtotal) : 0;
      gstData = {
        gstNumber: gstNumber || null,
        gstRate: rate || null,
        gstAmount: rate > 0 ? Number((base * rate / 100).toFixed(2)) : null,
      };
    }
    const order = await db.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
        ...(courierName !== undefined && { courierName: courierName || null }),
        ...(trackingNumber !== undefined && { trackingNumber: trackingNumber || null }),
        ...gstData,
      },
    });
    return NextResponse.json({ orderId: order.id, status: order.status });
  } catch {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
