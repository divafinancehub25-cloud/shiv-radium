export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

// Verify Razorpay signature server-side, then mark the order PAID + CONFIRMED.
export async function POST(req: NextRequest) {
  try {
    const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json();
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret || !orderId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment data" }, { status: 400 });
    }

    // Signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      // Tampered / failed verification — leave order pending, flag as failed
      await db.order.update({
        where: { id: orderId },
        data: { paymentStatus: "FAILED" },
      }).catch(() => {});
      return NextResponse.json({ verified: false, error: "Signature mismatch" }, { status: 400 });
    }

    // Verified — confirm the order
    await db.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
      },
    });

    return NextResponse.json({ verified: true });
  } catch (err) {
    console.error("Verify error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
