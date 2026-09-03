// Single source of truth for shipping calculation — used by the checkout
// quote API (display) AND the order API (authoritative, server-side recalc).
// One shipping charge per order (never duplicated), never NaN/null.

export type ShipItem = {
  productId: string;
  quantity: number;
  totalPrice: number;
  shippingClass?: string | null; // "free" | "flat" | null
  shippingCost?: number | null;  // flat cost when shippingClass === "flat"
};

export type ShipSettings = {
  manualCharge: number; // admin-set flat shipping charge (manual, no automation)
};

export function readShipSettings(map: Record<string, string>): ShipSettings {
  const c = Number(map.shipping_charge);
  return { manualCharge: Number.isFinite(c) && c >= 0 ? c : 49 };
}

// MANUAL shipping (no free-above automation): admin sets one flat charge.
// A product the admin explicitly marks "free" ships free; if EVERY item is
// free the order ships free. One charge per order — never NaN/null/duplicated.
export function computeShipping(items: ShipItem[], settings: ShipSettings): number {
  if (!items || items.length === 0) return 0;

  // If every product is marked free by admin, order ships free
  if (items.every((it) => it.shippingClass === "free")) return 0;

  // One charge = highest per-product (free=0, flat cost if set, else admin's manual charge)
  let charge = 0;
  for (const it of items) {
    let per: number;
    if (it.shippingClass === "free") per = 0;
    else if (it.shippingClass === "flat" && it.shippingCost != null && Number.isFinite(Number(it.shippingCost))) per = Number(it.shippingCost);
    else per = settings.manualCharge;
    if (per > charge) charge = per;
  }
  return Math.max(0, Math.round(charge));
}
