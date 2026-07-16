"use client";

// Shared customer-side blocks for the WooCommerce-style product features.
// Every feature renders only when admin has enabled it on that product.

export type ExtrasProduct = {
  basePrice: number;
  salePrice?: number | null;
  discountPct?: number | null;
  stockStatus?: string;
  manageStock?: boolean;
  stockQty?: number | null;
  soldIndividually?: boolean;
  shippingClass?: string | null;
  shippingCost?: number | null;
  codAvailable?: boolean;
  weightGrams?: number | null;
  lengthIn?: number | null;
  widthIn?: number | null;
  heightIn?: number | null;
  noReturnPolicy?: boolean;
  attributes?: { name: string; values: string[] }[] | null;
};

export function effectivePrice(p: ExtrasProduct): number {
  return p.salePrice && p.salePrice > 0 && p.salePrice < p.basePrice ? p.salePrice : p.basePrice;
}

export function isOutOfStock(p: ExtrasProduct): boolean {
  if (p.stockStatus === "OUT_OF_STOCK") return true;
  if (p.manageStock && p.stockQty !== null && p.stockQty !== undefined && p.stockQty <= 0) return true;
  return false;
}

// ── Price with sale strikethrough + discount badge ──
export function PriceTag({ p }: { p: ExtrasProduct }) {
  const onSale = p.salePrice && p.salePrice > 0 && p.salePrice < p.basePrice;
  const pct = p.discountPct ?? (onSale ? Math.round((1 - p.salePrice! / p.basePrice) * 100) : null);
  return (
    <span className="flex items-center gap-2 flex-wrap">
      <span className="text-3xl font-bold text-orange-500">₹{effectivePrice(p)}</span>
      {onSale && <span className="text-lg text-gray-400 line-through">₹{p.basePrice}</span>}
      {onSale && pct ? <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">{pct}% OFF</span> : null}
    </span>
  );
}

// ── Stock / shipping / COD / return badges + weight & dimensions ──
export function ProductBadges({ p }: { p: ExtrasProduct }) {
  const oos = isOutOfStock(p);
  const backorder = p.stockStatus === "ON_BACKORDER";
  const dims = [p.lengthIn, p.widthIn, p.heightIn].filter((x) => x);
  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2 text-xs">
        {oos ? (
          <span className="bg-red-100 text-red-700 font-semibold px-2.5 py-1 rounded-full">✕ Out of Stock</span>
        ) : backorder ? (
          <span className="bg-yellow-100 text-yellow-700 font-semibold px-2.5 py-1 rounded-full">⏳ On Backorder</span>
        ) : (
          <span className="bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">✓ In Stock{p.manageStock && p.stockQty ? ` (${p.stockQty} left)` : ""}</span>
        )}
        {p.shippingClass === "free" && <span className="bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-full">🚚 Free Shipping</span>}
        {p.shippingClass === "flat" && p.shippingCost ? <span className="bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded-full">🚚 Shipping ₹{p.shippingCost}</span> : null}
        {p.codAvailable && <span className="bg-gray-100 text-gray-700 font-semibold px-2.5 py-1 rounded-full">💵 COD Available</span>}
        {p.noReturnPolicy && <span className="bg-red-50 text-red-600 font-semibold px-2.5 py-1 rounded-full">🚫 No Return Policy</span>}
        {p.soldIndividually && <span className="bg-purple-50 text-purple-600 font-semibold px-2.5 py-1 rounded-full">1️⃣ Max 1 per order</span>}
      </div>
      {(p.weightGrams || dims.length > 0) && (
        <p className="text-xs text-gray-400">
          {p.weightGrams ? <>Weight: <strong className="text-gray-600">{p.weightGrams}g</strong></> : null}
          {p.weightGrams && dims.length > 0 ? " • " : ""}
          {dims.length > 0 ? <>Dimensions: <strong className="text-gray-600">{p.lengthIn ?? "—"} × {p.widthIn ?? "—"} × {p.heightIn ?? "—"} inch</strong> (L×W×H)</> : null}
        </p>
      )}
    </div>
  );
}

// ── Attribute chips (Size / Quality / Colour / custom) ──
export function AttributePicker({
  attributes,
  selected,
  onSelect,
}: {
  attributes: { name: string; values: string[] }[];
  selected: Record<string, string>;
  onSelect: (name: string, value: string) => void;
}) {
  if (!attributes || attributes.length === 0) return null;
  return (
    <div className="space-y-3">
      {attributes.map((attr) => (
        <div key={attr.name}>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {attr.name} {selected[attr.name] && <span className="text-orange-500 font-normal">— {selected[attr.name]}</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {attr.values.map((v) => (
              <button
                key={v}
                onClick={() => onSelect(attr.name, v)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${selected[attr.name] === v ? "border-orange-500 bg-orange-50 text-orange-600" : "border-gray-200 text-gray-700 hover:border-orange-300"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
