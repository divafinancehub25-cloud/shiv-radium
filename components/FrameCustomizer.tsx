"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Upload, Zap, PenLine, X } from "lucide-react";
import { PriceTag, ProductBadges, AttributePicker, isOutOfStock, variablePrice, findVariation, variationPending, type ExtrasProduct } from "@/components/ProductExtras";
import CropModal from "@/components/CropModal";
import ProductGallery from "@/components/ProductGallery";

// ─── Types (mirror of admin FrameDesigner) ──────────────────────────────────

type FrameElement = {
  id: string;
  type: "image" | "text" | "frame";
  label: string;
  x: number; y: number; w: number; h: number;
  radius: number; rotation: number; z: number;
  text?: string; fontFamily?: string; fontSize?: number; fontWeight?: string;
  align?: "left" | "center" | "right"; color?: string;
  shape?: "rect" | "ellipse" | "rounded"; fill?: string;
  defaultImage?: string;
  imgScale?: number;
  imgX?: number;
  imgY?: number;
  // Per-element effects set by admin in Frame Designer
  shadowOn?: boolean;
  shadowType?: "outer" | "inner";
  shadowColor?: string;
  shadowBlur?: number;
  shadowX?: number;
  shadowY?: number;
  gradOn?: boolean;
  gradColor1?: string;
  gradColor2?: string;
  gradAngle?: number;
  gradIntensity?: number;
};

// Same effect math as the admin designer so preview matches exactly
function shadowCss(el: FrameElement): { boxShadow?: string; textShadow?: string } {
  if (!el.shadowOn) return {};
  const color = el.shadowColor ?? "#000000";
  const blur = el.shadowBlur ?? 10;
  const x = el.shadowX ?? 0;
  const y = el.shadowY ?? 4;
  if (el.type === "text") {
    return { textShadow: el.shadowType === "inner" ? `0 1px 1px ${color}` : `${x}px ${y}px ${blur}px ${color}` };
  }
  return { boxShadow: `${el.shadowType === "inner" ? "inset " : ""}${x}px ${y}px ${blur}px ${color}` };
}

function gradientCss(el: FrameElement): string | null {
  if (!el.gradOn) return null;
  const c1 = el.gradColor1 ?? "#f97316";
  const c2 = el.gradColor2 ?? "#ffffff";
  const angle = el.gradAngle ?? 135;
  const stop = Math.max(0, Math.min(100, el.gradIntensity ?? 50));
  return `linear-gradient(${angle}deg, ${c1} ${stop}%, ${c2} 100%)`;
}

type CustomerOptions = {
  frameColors: { allowed: string[]; default: string };
  textColors: { allowed: string[]; default: string };
  fonts: { allowed: string[]; default: string };
  textSizes: { allowed: { label: string; px: number }[]; default: number };
  customFonts: { label: string; family: string; url?: string; dataUrl?: string }[];
  bgAspect?: number;
  acrylicMirror?: { enabled: boolean; allowed: string[]; default: string };
};

// Acrylic mirror finishes (must match admin FrameDesigner list)
const MIRROR_FINISHES: Record<string, string> = {
  "Normal Gold": "linear-gradient(135deg,#fdf3c0 0%,#d4af37 35%,#8a6d1f 60%,#f7e690 100%)",
  "Copper Gold": "linear-gradient(135deg,#f6d3ad 0%,#b87333 40%,#7a4318 65%,#e8b98a 100%)",
  "Rose Gold": "linear-gradient(135deg,#f9d6d0 0%,#b76e79 40%,#7d4750 65%,#f2c0b8 100%)",
  "Pink Gold": "linear-gradient(135deg,#ffe3e6 0%,#e0a3a3 40%,#a9666c 65%,#ffd0d6 100%)",
  "Metallic Gold": "linear-gradient(135deg,#fffbe6 0%,#cfa93f 30%,#6b5310 55%,#ffe98a 80%,#cfa93f 100%)",
  "Silver Mirror": "linear-gradient(135deg,#ffffff 0%,#c7ccd1 35%,#7d8288 60%,#eef1f4 100%)",
  "Black Mirror": "linear-gradient(135deg,#6e6e6e 0%,#2b2b2b 40%,#000000 65%,#5a5a5a 100%)",
};
const MIRROR_TEXT_SHADOW = "0 1px 0 rgba(255,255,255,.6), 0 2px 2px rgba(0,0,0,.35), 0 4px 6px rgba(0,0,0,.3)";

type Template = {
  id: string;
  name: string;
  elements: FrameElement[];
  bgImage: string | null;
  options: CustomerOptions | null;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  deliveryDays: number;
  images: string[];
  customizeEnabled?: boolean;
} & ExtrasProduct;

const FONT_LABELS: Record<string, string> = {
  "Arial, sans-serif": "Arial",
  "'Playfair Display', serif": "Playfair Display",
  "'Courier New', monospace": "Courier New",
  "'Amatic SC', cursive": "Amatic SC",
  "'Dancing Script', cursive": "Dancing Script",
  "'Poppins', sans-serif": "Poppins",
};

type Overrides = Record<string, { image?: string; text?: string; scale?: number; offX?: number; offY?: number }>;

export default function FrameCustomizer({ product, templates }: { product: Product; templates: Template[] }) {
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(0);
  const [customizing, setCustomizing] = useState(false);
  const [overrides, setOverrides] = useState<Overrides>({});
  // null = default design value; set only when customer picks
  const [frameColor, setFrameColor] = useState<string | null>(null);
  const [textColor, setTextColor] = useState<string | null>(null);
  const [font, setFont] = useState<string | null>(null);
  const [textSize, setTextSize] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  // Variable product: matched variation drives price/stock; else simple behavior
  const variation = findVariation(product.variations, selectedAttrs);
  const needsVariation = variationPending(product, selectedAttrs);
  const outOfStock = isOutOfStock(product) || variation?.stockStatus === "OUT_OF_STOCK";
  const price = variablePrice(product, selectedAttrs);
  const [uploading, setUploading] = useState<string | null>(null);
  const [cropState, setCropState] = useState<{ file: File; elId: string; aspect: number } | null>(null);
  // Step-by-step customize drawer: 1 = Text/Photo, 2 = Color & Size
  const [step, setStep] = useState(1);
  const [mirrorFinish, setMirrorFinish] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const canvasRef = useRef<HTMLDivElement>(null);
  const scaleDragRef = useRef<{ elId: string; mode: "scale" | "pan"; startX: number; startY: number; origScale: number; origX: number; origY: number; elW: number; elH: number } | null>(null);

  function startImgDrag(el: FrameElement, mode: "scale" | "pan", e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    const o = overrides[el.id];
    scaleDragRef.current = {
      elId: el.id, mode, startX: e.clientX, startY: e.clientY,
      origScale: o?.scale ?? el.imgScale ?? 1,
      origX: o?.offX ?? el.imgX ?? 0,
      origY: o?.offY ?? el.imgY ?? 0,
      elW: el.w, elH: el.h,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onScaleDragMove(e: React.PointerEvent) {
    const d = scaleDragRef.current;
    if (!d || !canvasRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    const dx = ((e.clientX - d.startX) / r.width) * 100;
    const dy = ((e.clientY - d.startY) / r.height) * 100;
    if (d.mode === "scale") {
      setOverrides((p) => ({ ...p, [d.elId]: { ...p[d.elId], scale: Math.max(0.3, Math.min(4, d.origScale + dx / 30)) } }));
    } else {
      setOverrides((p) => ({
        ...p,
        [d.elId]: {
          ...p[d.elId],
          offX: Math.max(-100, Math.min(100, d.origX + (dx / d.elW) * 100)),
          offY: Math.max(-100, Math.min(100, d.origY + (dy / d.elH) * 100)),
        },
      }));
    }
  }

  function endScaleDrag() {
    scaleDragRef.current = null;
  }

  const template = templates[activeIdx];
  const opts = template.options;
  const elements = [...template.elements].sort((a, b) => a.z - b.z);
  const imageBoxes = elements.filter((e) => e.type === "image");
  const textBoxes = elements.filter((e) => e.type === "text");

  function switchTemplate(i: number) {
    setActiveIdx(i);
    setOverrides({});
    setFrameColor(null);
    setTextColor(null);
    setFont(null);
    setTextSize(null);
  }

  async function uploadImage(elId: string, file: File) {
    setUploading(elId);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok && data.url) {
      setOverrides((p) => ({ ...p, [elId]: { ...p[elId], image: data.url } }));
    }
    setUploading(null);
  }

  function addToCart(useDefault: boolean) {
    if (needsVariation) {
      alert("Pehle saare options select karo (Size/Colour...)");
      return;
    }
    const customizationData: Record<string, string> = {
      _frame_template: template.name,
    };
    for (const el of textBoxes) {
      customizationData[el.label] = (!useDefault && overrides[el.id]?.text) || el.text || "";
    }
    for (const el of imageBoxes) {
      const img = (!useDefault && overrides[el.id]?.image) || el.defaultImage;
      if (img) customizationData[el.label] = img;
      const scale = !useDefault ? overrides[el.id]?.scale : undefined;
      if (scale && scale !== 1) customizationData[`${el.label} Zoom`] = `${Math.round(scale * 100)}%`;
      const ox = !useDefault ? overrides[el.id]?.offX : undefined;
      const oy = !useDefault ? overrides[el.id]?.offY : undefined;
      if ((ox && ox !== 0) || (oy && oy !== 0)) customizationData[`${el.label} Adjust`] = `${Math.round(ox ?? 0)}%, ${Math.round(oy ?? 0)}%`;
    }
    for (const [k, v] of Object.entries(selectedAttrs)) customizationData[k] = v;
    if (!useDefault) {
      if (frameColor) customizationData["Frame Color"] = frameColor;
      if (textColor) customizationData["Text Color"] = textColor;
      if (font) customizationData["Font Style"] = FONT_LABELS[font] ?? font;
      if (textSize) customizationData["Text Size"] = `${textSize}px`;
      if (mirrorFinish) customizationData["Acrylic Mirror Finish"] = `${mirrorFinish} (4mm mirror, 3D raised)`;
    }
    const existing = JSON.parse(localStorage.getItem("cart") ?? "[]");
    localStorage.setItem("cart", JSON.stringify([
      ...existing,
      {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productImage: template.bgImage ?? product.images?.[0] ?? null,
        quantity: product.soldIndividually ? 1 : quantity,
        unitPrice: price,
        totalPrice: price * (product.soldIndividually ? 1 : quantity),
        customizationData,
      },
    ]));
    router.push("/cart");
  }

  // ── Render one element (design locked — no drag) ──
  function renderElement(el: FrameElement) {
    const borderRadius = el.shape === "ellipse" ? "50%" : `${el.radius}px`;
    const style: React.CSSProperties = {
      position: "absolute",
      left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`,
      transform: `rotate(${el.rotation}deg)`, zIndex: el.z, borderRadius,
      ...(el.type !== "text" ? shadowCss(el) : {}),
    };
    const grad = gradientCss(el);
    if (el.type === "frame") {
      // Customer's frame colour wins over the admin gradient when chosen
      return <div key={el.id} style={{ ...style, background: frameColor ?? grad ?? el.fill }} />;
    }
    if (el.type === "image") {
      const img = overrides[el.id]?.image ?? el.defaultImage;
      const scale = overrides[el.id]?.scale ?? el.imgScale ?? 1;
      const offX = overrides[el.id]?.offX ?? el.imgX ?? 0;
      const offY = overrides[el.id]?.offY ?? el.imgY ?? 0;
      return (
        <div
          key={el.id}
          style={style}
          onClick={() => customizing && fileRefs.current[el.id]?.click()}
          className={customizing ? "cursor-pointer" : ""}
        >
          {img ? (
            <div style={{ borderRadius }} className="w-full h-full overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={el.label} draggable={false} style={{ transform: `translate(${offX}%, ${offY}%) scale(${scale})` }} className="w-full h-full object-cover" />
              {grad && <div style={{ background: grad, borderRadius }} className="absolute inset-0 pointer-events-none mix-blend-overlay" />}
              {customizing && (
                <>
                  <div
                    onPointerDown={(e) => startImgDrag(el, "scale", e)}
                    onClick={(e) => e.stopPropagation()}
                    title="Photo zoom — drag karo"
                    className="absolute bottom-1 right-1 w-5 h-5 bg-blue-500 border-2 border-white rounded-full cursor-ew-resize shadow z-10"
                  />
                  <div
                    onPointerDown={(e) => startImgDrag(el, "pan", e)}
                    onClick={(e) => e.stopPropagation()}
                    title="Photo adjust — up/down/left/right drag karo"
                    className="absolute bottom-1 left-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full cursor-move shadow z-10"
                  />
                </>
              )}
            </div>
          ) : (
            <div style={{ borderRadius }} className="w-full h-full bg-gray-100/80 flex items-center justify-center">
              <span className="text-[10px] text-gray-400 text-center px-1">{customizing ? "Tap to add photo" : el.label}</span>
            </div>
          )}
          {customizing && uploading === el.id && (
            <div style={{ borderRadius }} className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px]">Uploading...</div>
          )}
        </div>
      );
    }
    // text — mirror finish overrides plain color with a metallic gradient
    const content = overrides[el.id]?.text ?? el.text;
    // Customer's mirror finish wins; otherwise admin's per-element gradient
    const mirrorGradient = mirrorFinish ? MIRROR_FINISHES[mirrorFinish] : grad;
    return (
      <div
        key={el.id}
        style={{
          ...style,
          fontFamily: font ?? el.fontFamily,
          fontSize: `${textSize ?? el.fontSize}px`,
          fontWeight: el.fontWeight as React.CSSProperties["fontWeight"],
          color: mirrorGradient ? undefined : (textColor ?? el.color),
          textAlign: el.align,
        }}
        className="flex items-center overflow-hidden"
      >
        <span
          className="w-full leading-tight"
          style={
            mirrorGradient
              ? {
                  textAlign: el.align,
                  backgroundImage: mirrorGradient,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  filter: mirrorFinish
                    ? "drop-shadow(0 2px 2px rgba(0,0,0,.35))"
                    : el.shadowOn
                      ? `drop-shadow(${el.shadowX ?? 0}px ${el.shadowY ?? 4}px ${el.shadowBlur ?? 10}px ${el.shadowColor ?? "#000"})`
                      : undefined,
                }
              : { textAlign: el.align, ...shadowCss(el) }
          }
        >
          {content}
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-28 md:pb-16 grid lg:grid-cols-2 gap-8">
      {/* Fonts for preview */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Amatic+SC:wght@400;700&family=Dancing+Script&family=Poppins:wght@400;600&display=swap"
        rel="stylesheet"
      />
      {(opts?.customFonts ?? []).filter((f) => f.url).map((f) => (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link key={f.url} href={f.url} rel="stylesheet" />
      ))}
      {(opts?.customFonts ?? []).some((f) => f.dataUrl) && (
        <style>{(opts?.customFonts ?? []).filter((f) => f.dataUrl).map((f) =>
          `@font-face{font-family:${f.family.split(",")[0]};src:url(${f.dataUrl});font-display:swap;}`
        ).join("\n")}</style>
      )}

      {/* ── Left: Product image (customize ab drawer mein khulta hai) ── */}
      <div className="space-y-4">
        <ProductGallery images={product.images} name={product.name} productId={product.id} />

        {/* Hidden file inputs per image box */}
        {imageBoxes.map((el) => (
          <input
            key={el.id}
            ref={(r) => { fileRefs.current[el.id] = r; }}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              // Crop first — box ke preset shape mein
              if (file) setCropState({ file, elId: el.id, aspect: (el.w / el.h) * (opts?.bgAspect || 1) });
              e.target.value = "";
            }}
          />
        ))}
      </div>

      {/* ── Right: Info + actions ── */}
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <div className="flex items-center gap-4 flex-wrap">
            <PriceTag p={product} />
            <span className="text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-full">🚚 {product.deliveryDays} days delivery</span>
          </div>
          <ProductBadges p={product} />

          {/* Attributes — Size / Quality / Colour / custom */}
          {(product.attributes?.length ?? 0) > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <AttributePicker
                attributes={product.attributes!}
                selected={selectedAttrs}
                onSelect={(name, value) => setSelectedAttrs((p) => ({ ...p, [name]: value }))}
              />
              {needsVariation && (
                <p className="text-xs text-amber-600 mt-2">👆 Saare options select karo — price uske hisaab se aayega</p>
              )}
              {variation && (
                <div className="mt-3 flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-xl p-3">
                  {variation.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={variation.image} alt="" className="w-12 h-12 object-cover rounded-lg border border-orange-200" />
                  )}
                  <p className="text-sm font-semibold text-gray-800">
                    {Object.values(variation.attrs).join(" • ")}: <span className="text-orange-500">₹{price}</span>
                    {variation.salePrice && variation.salePrice < variation.price ? (
                      <span className="text-xs text-gray-400 line-through ml-1.5">₹{variation.price}</span>
                    ) : null}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Buy Now / Customize Now */}
          <div className={`grid ${product.customizeEnabled !== false ? "grid-cols-2" : "grid-cols-1"} gap-3 mt-5`}>
            <button
              onClick={() => addToCart(true)}
              disabled={outOfStock}
              className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors"
            >
              <Zap className="w-4 h-4" /> {outOfStock ? "Out of Stock" : "Buy Now"}
            </button>
            {product.customizeEnabled !== false && (
              <button
                onClick={() => { setStep(1); setCustomizing(true); }}
                className="flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-all bg-gradient-to-r from-gray-900 to-gray-700 hover:from-black hover:to-gray-800 text-amber-300 shadow-lg"
              >
                <PenLine className="w-4 h-4" /> Customize Now
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Buy Now = ready design ke saath order • Customize Now = apni photo/text/color lagao
          </p>
        </div>

        {/* Quantity + Add to Cart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {product.soldIndividually ? (
            <p className="text-xs text-gray-400 mb-4">1️⃣ Ye product ek order mein sirf 1 hi liya ja sakta hai</p>
          ) : (
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700">Quantity</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold hover:border-orange-400 transition-colors">−</button>
                <span className="w-8 text-center font-bold text-lg text-gray-900">{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)} className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold hover:border-orange-400 transition-colors">+</button>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
            <span className="text-gray-600 font-medium">Total Amount</span>
            <span className="text-3xl font-bold text-orange-500">₹{price * (product.soldIndividually ? 1 : quantity)}</span>
          </div>
          <button
            onClick={() => addToCart(!customizing)}
            disabled={outOfStock}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-200"
          >
            <ShoppingCart className="w-5 h-5" /> {outOfStock ? "Out of Stock" : "Add to Cart"}
          </button>

          {/* WhatsApp trust badge */}
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2.5">
            <span className="text-xl">💬</span>
            <div>
              <p className="text-sm font-semibold text-green-800">WhatsApp Design Approval</p>
              <p className="text-xs text-green-700 mt-0.5">Order ke baad final design WhatsApp pe bhejenge — approval ke baad hi banega.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky mobile action bar — hamesha screen ke bottom pe ── */}
      {!customizing && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur px-3 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden">
          <div className={`grid ${product.customizeEnabled !== false ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
            <button
              onClick={() => addToCart(true)}
              disabled={outOfStock}
              className="flex items-center justify-center gap-1.5 bg-white text-gray-900 font-bold py-3 rounded-2xl shadow-sm disabled:opacity-40"
            >
              <Zap className="w-4 h-4" /> {outOfStock ? "Out of Stock" : "Buy Now"}
            </button>
            {product.customizeEnabled !== false && (
              <button
                onClick={() => { setStep(1); setCustomizing(true); }}
                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-gray-900 to-gray-700 text-amber-300 font-bold py-3 rounded-2xl shadow-lg"
              >
                <PenLine className="w-4 h-4" /> Customize Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Customize Drawer — popup, page change nahi hota ── */}
      {customizing && (
        <div className="fixed inset-0 z-[75] flex justify-end bg-black/50" onClick={() => setCustomizing(false)}>
          <div
            className="w-full md:max-w-lg h-full bg-gray-50 flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm shrink-0">
              <p className="font-bold text-gray-900 flex items-center gap-2"><PenLine className="w-4 h-4 text-amber-500" /> Apna Design Banao</p>
              <button onClick={() => setCustomizing(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Template tabs */}
              {templates.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {templates.map((t, i) => (
                    <button
                      key={t.id}
                      onClick={() => switchTemplate(i)}
                      className={`shrink-0 px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${i === activeIdx ? "bg-gray-900 text-amber-300" : "bg-white text-gray-600 shadow-sm"}`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              )}

              {/* LIVE PREVIEW — type karte hi yahan update hota hai */}
              <div
                ref={canvasRef}
                onPointerMove={onScaleDragMove}
                onPointerUp={endScaleDrag}
                onPointerLeave={endScaleDrag}
                className="relative w-full bg-white rounded-2xl shadow-md overflow-hidden"
                style={{
                  aspectRatio: `${opts?.bgAspect || 1}`,
                  backgroundImage: template.bgImage ? `url(${template.bgImage})` : undefined,
                  backgroundSize: "100% 100%",
                  backgroundPosition: "center",
                }}
              >
                {elements.map(renderElement)}
                <div className="absolute top-3 left-3 bg-gray-900/80 text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider z-50">
                  ● Live Preview
                </div>
              </div>

              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2">
                {[{ n: 1, l: "Text & Photo" }, { n: 2, l: "Color & Size" }].map((s2, i) => (
                  <button key={s2.n} onClick={() => setStep(s2.n)} className="flex items-center gap-1.5">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === s2.n ? "bg-gray-900 text-amber-300" : step > s2.n ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                      {step > s2.n ? "✓" : s2.n}
                    </span>
                    <span className={`text-[11px] font-medium ${step === s2.n ? "text-gray-900" : "text-gray-400"}`}>{s2.l}</span>
                    {i < 1 && <span className="w-4 h-px bg-gray-300 ml-1" />}
                  </button>
                ))}
              </div>

              {/* STEP 1 — Text & Photo */}
              {step === 1 && (
                <div className="space-y-4">
                  {textBoxes.map((el) => (
                    <div key={el.id} className="bg-white rounded-2xl shadow-sm p-4">
                      <label className="block text-sm font-semibold text-gray-800 mb-2">✏️ {el.label}</label>
                      <div className="relative">
                        <input
                          className="w-full bg-gray-100 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 pr-14"
                          style={{ border: "none" }}
                          placeholder={el.text}
                          maxLength={el.text?.length || 30}
                          value={overrides[el.id]?.text ?? ""}
                          onChange={(e) => setOverrides((p) => ({ ...p, [el.id]: { ...p[el.id], text: e.target.value.slice(0, el.text?.length || 30) } }))}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                          {(overrides[el.id]?.text ?? "").length}/{el.text?.length || 30}
                        </span>
                      </div>
                    </div>
                  ))}
                  {imageBoxes.map((el) => (
                    <div key={el.id} className="bg-white rounded-2xl shadow-sm p-4">
                      <label className="block text-sm font-semibold text-gray-800 mb-2">📸 {el.label}</label>
                      <button
                        onClick={() => fileRefs.current[el.id]?.click()}
                        className="w-full flex items-center gap-3 bg-gray-100 rounded-2xl p-3 text-left hover:bg-amber-50 transition-colors"
                        style={{ border: "none" }}
                      >
                        {(overrides[el.id]?.image ?? el.defaultImage) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={overrides[el.id]?.image ?? el.defaultImage} alt="" className="w-12 h-12 object-cover rounded-xl" />
                        ) : (
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm"><Upload className="w-4 h-4 text-gray-400" /></div>
                        )}
                        <span className="text-sm text-gray-600">
                          {uploading === el.id ? "Uploading..." : overrides[el.id]?.image ? "Photo lagi ✓ — change karne ke liye tap karo" : "Apni photo lagao"}
                        </span>
                      </button>
                    </div>
                  ))}
                  {imageBoxes.length > 0 && (
                    <p className="text-[11px] text-gray-400 text-center">Preview mein photo pe tap karke bhi change kar sakte ho • 🔵 = zoom, 🟢 = adjust</p>
                  )}
                </div>
              )}

              {/* STEP 2 — Color & Size */}
              {step === 2 && (
                <div className="space-y-4">
                  {opts && opts.frameColors.allowed.length > 0 && elements.some((e) => e.type === "frame") && (
                    <div className="bg-white rounded-2xl shadow-sm p-4">
                      <label className="block text-sm font-semibold text-gray-800 mb-2">🎨 Frame Color</label>
                      <div className="flex flex-wrap gap-3">
                        {opts.frameColors.allowed.map((c) => (
                          <button
                            key={c}
                            onClick={() => setFrameColor(c)}
                            style={{ background: c, border: "none" }}
                            className={`w-10 h-10 rounded-full transition-transform hover:scale-110 shadow ${(frameColor ?? "") === c ? "ring-4 ring-amber-300 scale-110" : ""}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {opts && opts.textColors.allowed.length > 0 && textBoxes.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-4">
                      <label className="block text-sm font-semibold text-gray-800 mb-2">🖍️ Text Color</label>
                      <div className="flex flex-wrap gap-3">
                        {opts.textColors.allowed.map((c) => (
                          <button
                            key={c}
                            onClick={() => setTextColor(c)}
                            style={{ background: c, border: "none" }}
                            className={`w-10 h-10 rounded-full transition-transform hover:scale-110 shadow ${(textColor ?? "") === c ? "ring-4 ring-amber-300 scale-110" : ""}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Acrylic Mirror finish — admin-enabled premium option */}
                  {opts?.acrylicMirror?.enabled && opts.acrylicMirror.allowed.length > 0 && textBoxes.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-4">
                      <label className="block text-sm font-semibold text-gray-800 mb-1">✨ Acrylic Mirror Text</label>
                      <p className="text-[11px] text-gray-400 mb-2">4mm mirror finish, 3D raised look — premium</p>
                      <div className="flex flex-wrap gap-3">
                        {opts.acrylicMirror.allowed.map((label) => (
                          <button
                            key={label}
                            onClick={() => setMirrorFinish(mirrorFinish === label ? null : label)}
                            style={{ border: "none" }}
                            className="flex flex-col items-center gap-1"
                          >
                            <span
                              style={{ background: MIRROR_FINISHES[label] ?? "#ccc", boxShadow: MIRROR_TEXT_SHADOW }}
                              className={`w-11 h-11 rounded-full transition-transform ${mirrorFinish === label ? "ring-4 ring-amber-300 scale-110" : ""}`}
                            />
                            <span className={`text-[9px] leading-tight text-center max-w-[62px] ${mirrorFinish === label ? "text-gray-900 font-semibold" : "text-gray-500"}`}>{label}</span>
                          </button>
                        ))}
                      </div>
                      {mirrorFinish && (
                        <button onClick={() => setMirrorFinish(null)} style={{ border: "none" }} className="mt-2 text-[11px] text-gray-400 hover:text-gray-600">
                          ✕ Normal color pe wapas jao
                        </button>
                      )}
                    </div>
                  )}

                  {opts && opts.fonts.allowed.length > 0 && textBoxes.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-4">
                      <label className="block text-sm font-semibold text-gray-800 mb-2">🔤 Writing Style</label>
                      <div className="grid grid-cols-2 gap-2">
                        {opts.fonts.allowed.map((f) => {
                          const label = FONT_LABELS[f] ?? opts.customFonts.find((cf) => cf.family === f)?.label ?? f;
                          return (
                            <button
                              key={f}
                              onClick={() => setFont(f)}
                              style={{ fontFamily: f, border: "none" }}
                              className={`px-3 py-3 rounded-2xl text-base transition-colors ${(font ?? "") === f ? "bg-gray-900 text-amber-300" : "bg-gray-100 text-gray-700 hover:bg-amber-50"}`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {opts && opts.textSizes.allowed.length > 0 && textBoxes.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-4">
                      <label className="block text-sm font-semibold text-gray-800 mb-2">📏 Text Size</label>
                      <div className="flex gap-2">
                        {opts.textSizes.allowed.map((s2) => (
                          <button
                            key={s2.px}
                            onClick={() => setTextSize(s2.px)}
                            style={{ border: "none" }}
                            className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-colors ${(textSize ?? 0) === s2.px ? "bg-gray-900 text-amber-300" : "bg-gray-100 text-gray-700 hover:bg-amber-50"}`}
                          >
                            {s2.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {(product.attributes?.length ?? 0) > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-4">
                      <AttributePicker
                        attributes={product.attributes!}
                        selected={selectedAttrs}
                        onSelect={(name, value) => setSelectedAttrs((p) => ({ ...p, [name]: value }))}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step nav */}
              <div className="flex gap-2 pb-2">
                {step > 1 && (
                  <button onClick={() => setStep((s2) => s2 - 1)} style={{ border: "none" }} className="flex-1 bg-white shadow-sm text-gray-700 font-semibold py-3 rounded-2xl">
                    ← Back
                  </button>
                )}
                {step < 2 && (
                  <button onClick={() => setStep((s2) => s2 + 1)} style={{ border: "none" }} className="flex-1 bg-gray-900 text-amber-300 font-bold py-3 rounded-2xl">
                    Next →
                  </button>
                )}
              </div>
            </div>

            {/* Sticky footer — price + add to cart */}
            <div className="shrink-0 bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
              {needsVariation && (
                <p className="text-[11px] text-amber-600 mb-1.5 text-center">👆 Step 2 mein saare options select karo</p>
              )}
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[10px] text-gray-400">Total</p>
                  <p className="text-xl font-bold text-gray-900">₹{price * (product.soldIndividually ? 1 : quantity)}</p>
                </div>
                <button
                  onClick={() => addToCart(false)}
                  disabled={outOfStock}
                  style={{ border: "none" }}
                  className="flex-1 bg-gradient-to-r from-gray-900 to-gray-700 text-amber-300 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <ShoppingCart className="w-4 h-4" /> {outOfStock ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crop modal — photo box ke shape mein crop hoti hai */}
      {cropState && (
        <CropModal
          file={cropState.file}
          aspect={cropState.aspect}
          onCancel={() => setCropState(null)}
          onDone={(cropped) => {
            const elId = cropState.elId;
            setCropState(null);
            uploadImage(elId, cropped);
          }}
        />
      )}
    </div>
  );
}
