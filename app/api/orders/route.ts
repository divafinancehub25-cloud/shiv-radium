export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeShipping, readShipSettings, type ShipItem } from "@/lib/shipping";

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
      items, giftWrapCharge,
      gstNumber, gstRate,
    } = body;

    if (!customerName || !customerPhone || !address || !city || !state || !pinCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── SERVER-SIDE recalculation (never trust client subtotal/shipping) ──
    const cartItems = (items as CartItem[]) ?? [];
    const productIds = [...new Set(cartItems.map((i) => i.productId).filter(Boolean))];
    const [prodRows, settingRows] = await Promise.all([
      db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, shippingClass: true, shippingCost: true } }),
      db.setting.findMany({ where: { key: { in: ["shipping_free_above", "shipping_charge"] } } }),
    ]);
    const pmap = new Map(prodRows.map((p) => [p.id, p]));
    const smap: Record<string, string> = {};
    for (const s of settingRows) smap[s.key] = s.value;

    const subtotal = cartItems.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);
    const shipItems: ShipItem[] = cartItems.map((i) => {
      const p = pmap.get(i.productId);
      return {
        productId: i.productId, quantity: Number(i.quantity) || 1, totalPrice: Number(i.totalPrice) || 0,
        shippingClass: p?.shippingClass ?? null,
        shippingCost: p?.shippingCost != null ? Number(p.shippingCost) : null,
      };
    });
    const shippingCharge = computeShipping(shipItems, readShipSettings(smap));

    const orderNumber = generateOrderNumber();
    const rate = gstRate ? parseFloat(gstRate) : 0;
    const gstAmount = rate > 0 ? Number((subtotal * rate / 100).toFixed(2)) : 0;
    const finalTotal = subtotal + shippingCharge + Number(giftWrapCharge ?? 0) + gstAmount;

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
        gstNumber: gstNumber || null,
        gstRate: rate || null,
        gstAmount: gstAmount || null,
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

    // Step 3: create a Razorpay order (online payment). If keys are missing,
    // fall back to a plain order (COD) so checkout never breaks.
    let razorpayOrderId: string | null = null;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keyId && keySecret) {
      try {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
          body: JSON.stringify({
            amount: Math.round(finalTotal * 100), // paise
            currency: "INR",
            receipt: orderNumber,
            notes: { orderId: order.id, orderNumber },
          }),
        });
        const rzpData = await rzpRes.json();
        if (rzpRes.ok && rzpData.id) {
          razorpayOrderId = rzpData.id;
          await db.order.update({ where: { id: order.id }, data: { razorpayOrderId } });
        } else {
          console.error("Razorpay order failed:", rzpData);
        }
      } catch (e) {
        console.error("Razorpay error:", e);
      }
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId,
      shippingCharge,
      totalAmount: finalTotal,
    });
  } catch (err) {
    console.error("Order error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
