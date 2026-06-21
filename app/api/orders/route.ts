export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function generateOrderNumber() {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SR${ymd}${rand}`;
}

type CartItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizationData: Record<string, string>;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName, customerPhone, customerEmail,
      address, city, state, pinCode,
      giftWrapping, giftMessage, deliveryDate,
      items, subtotal, shippingCharge, giftWrapCharge,
    } = body;

    if (!customerName || !customerPhone || !address || !city || !state || !pinCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const orderNumber = generateOrderNumber();
    const finalTotal = Number(subtotal) + Number(shippingCharge) + Number(giftWrapCharge ?? 0);

    // Step 1: create order without items
    const order = await db.order.create({
      data: {
        orderNumber,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        address,
        city,
        state,
        pinCode,
        subtotal,
        shippingCharge,
        totalAmount: finalTotal,
        giftWrapping: giftWrapping ?? false,
        giftMessage: giftMessage || null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      },
    });

    // Step 2: create order items one by one (avoids transaction)
    for (const item of items as CartItem[]) {
      await db.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          customizationData: item.customizationData,
          uploadedFiles: [],
        },
      });
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId: null,
    });
  } catch (err) {
    console.error("Order error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
