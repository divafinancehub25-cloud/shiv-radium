export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeShipping, readShipSettings, type ShipItem } from "@/lib/shipping";

// POST { items: [{ productId, quantity, totalPrice }] } → { shipping }
// Fetches real product shipping fields + admin settings; never trusts client.
export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();
    if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ shipping: 0 });

    const ids = [...new Set(items.map((i: { productId: string }) => i.productId).filter(Boolean))];
    const [products, settingRows] = await Promise.all([
      db.product.findMany({ where: { id: { in: ids } }, select: { id: true, shippingClass: true, shippingCost: true } }),
      db.setting.findMany({ where: { key: { in: ["shipping_free_above", "shipping_charge"] } } }),
    ]);
    const pmap = new Map(products.map((p) => [p.id, p]));
    const smap: Record<string, string> = {};
    for (const s of settingRows) smap[s.key] = s.value;

    const shipItems: ShipItem[] = items.map((i: { productId: string; quantity: number; totalPrice: number }) => {
      const p = pmap.get(i.productId);
      return {
        productId: i.productId,
        quantity: Number(i.quantity) || 1,
        totalPrice: Number(i.totalPrice) || 0,
        shippingClass: p?.shippingClass ?? null,
        shippingCost: p?.shippingCost != null ? Number(p.shippingCost) : null,
      };
    });

    const shipping = computeShipping(shipItems, readShipSettings(smap));
    return NextResponse.json({ shipping });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message, shipping: 0 }, { status: 500 });
  }
}
