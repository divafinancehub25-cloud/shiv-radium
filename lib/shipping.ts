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
  freeAbove: number;   // free shipping when subtotal >= this
  defaultCharge: number; // fallback flat charge
};

export function readShipSettings(map: Record<string, string>): ShipSettings {
  const freeAbove = Number(map.shipping_free_above);
  const defaultCharge = Number(map.shipping_charge);
  return {
    freeAbove: Number.isFinite(freeAbove) && freeAbove > 0 ? freeAbove : 999,
    defaultCharge: Number.isFinite(defaultCharge) && defaultCharge >= 0 ? defaultCharge : 99,
  };
}

// Returns a single non-negative shipping amount for the whole cart.
export function computeShipping(items: ShipItem[], settings: ShipSettings): number {
  if (!items || items.length === 0) return 0;

  const subtotal = items.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);

  // 1) Whole-cart free shipping threshold
  if (subtotal >= settings.freeAbove) return 0;

  // 2) If EVERY product ships free, order ships free
  const allFree = items.every((it) => it.shippingClass === "free");
  if (allFree) return 0;

  // 3) Otherwise one charge = the highest per-product charge (no duplication).
  //    free product => 0, flat with cost => that cost, else the admin default.
  let charge = 0;
  for (const it of items) {
    let per: number;
    if (it.shippingClass === "free") per = 0;
    else if (it.shippingClass === "flat" && it.shippingCost != null && Number.isFinite(Number(it.shippingCost))) per = Number(it.shippingCost);
    else per = settings.defaultCharge;
    if (per > charge) charge = per;
  }
  return Math.max(0, Math.round(charge));
}
