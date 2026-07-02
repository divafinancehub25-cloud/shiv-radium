export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

  // Verify signature
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (expectedSig !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = prisma as any;
    const bookingPayment = await p.bookingPayment?.findFirst({
      where: { razorpayOrderId: orderId },
    });

    if (bookingPayment) {
      await prisma.$transaction([
        p.bookingPayment.update({
          where: { id: bookingPayment.id },
          data: { razorpayPayId: payment.id, status: "PAID", paidAt: new Date() },
        }),
        p.booking.update({
          where: { id: bookingPayment.bookingId },
          data: {
            advanceAmount: { increment: payment.amount / 100 },
            balanceAmount: { decrement: payment.amount / 100 },
          },
        }),
      ]);
    }
  }

  return NextResponse.json({ received: true });
}
