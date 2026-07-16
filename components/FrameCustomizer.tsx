"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Upload, Zap, PenLine, X } from "lucide-react";

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
};

type CustomerOptions = {
  frameColors: { allowed: string[]; default: string };
  textColors: { allowed: string[]; default: string };
  fonts: { allowed: string[]; default: string };
  textSizes: { allowed: { label: string; px: number }[]; default: number };
  customFonts: { label: string; family: string; url?: string; dataUrl?: string }[];
  bgAspect?: number;
};

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
};

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
  const [uploading, setUploading] = useState<string | null>(null);
  const [fontOpen, setFontOpen] = useState(false);
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
    if (!useDefault) {
      if (frameColor) customizationData["Frame Color"] = frameColor;
      if (textColor) customizationData["Text Color"] = textColor;
      if (font) customizationData["Font Style"] = FONT_LABELS[font] ?? font;
      if (textSize) customizationData["Text Size"] = `${textSize}px`;
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
        quantity,
        unitPrice: product.basePrice,
        totalPrice: product.basePrice * quantity,
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
    };
    if (el.type === "frame") {
      return <div key={el.id} style={{ ...style, background: frameColor ?? el.fill }} />;
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
          className={customizing ? "cursor-pointer ring-2 ring-orange-400/70 hover:ring-orange-500" : ""}
        >
          {img ? (
            <div style={{ borderRadius }} className="w-full h-full overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={el.label} draggable={false} style={{ transform: `translate(${offX}%, ${offY}%) scale(${scale})` }} className="w-full h-full object-cover" />
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
            <div style={{ borderRadius }} className="w-full h-full bg-gray-100/80 border-2 border-dashed border-gray-300 flex items-center justify-center">
              <span className="text-[10px] text-gray-400 text-center px-1">{customizing ? "Tap to add photo" : el.label}</span>
            </div>
          )}
          {customizing && uploading === el.id && (
            <div style={{ borderRadius }} className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px]">Uploading...</div>
          )}
        </div>
      );
    }
    // text
    const content = overrides[el.id]?.text ?? el.text;
    return (
      <div
        key={el.id}
        style={{
          ...style,
          fontFamily: font ?? el.fontFamily,
          fontSize: `${textSize ?? el.fontSize}px`,
          fontWeight: el.fontWeight as React.CSSProperties["fontWeight"],
          color: textColor ?? el.color,
          textAlign: el.align,
        }}
        className={`flex items-center overflow-hidden ${customizing ? "ring-1 ring-orange-300/60" : ""}`}
      >
        <span className="w-full leading-tight" style={{ textAlign: el.align }}>{content}</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-16 grid lg:grid-cols-2 gap-8">
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

      {/* ── Left: Product image (default) / Design canvas (customizing) ── */}
      <div className="space-y-4">
        {!customizing ? (
          /* Normal product image — customize fields yahan nahi dikhte */
          <div className="relative w-full aspect-square bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex items-center justify-center">
            {product.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-8xl">🎁</span>
            )}
          </div>
        ) : (
          <>
            {/* Template tabs — customize mode mein hi */}
            {templates.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {templates.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => switchTemplate(i)}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${i === activeIdx ? "border-orange-500 bg-orange-50 text-orange-600" : "border-gray-200 text-gray-600 hover:border-orange-300"}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}

            <div
              ref={canvasRef}
              onPointerMove={onScaleDragMove}
              onPointerUp={endScaleDrag}
              onPointerLeave={endScaleDrag}
              className="relative w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              style={{
                aspectRatio: `${opts?.bgAspect || 1}`,
                backgroundImage: template.bgImage ? `url(${template.bgImage})` : undefined,
                backgroundSize: "100% 100%",
                backgroundPosition: "center",
              }}
            >
              {elements.map(renderElement)}
              <div className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow z-50">
                ✏️ Customizing
              </div>
            </div>
            {imageBoxes.length > 0 && (
              <p className="text-xs text-gray-400 text-center">📸 Photo pe tap = change • 🔵 blue dot drag = photo zoom</p>
            )}
          </>
        )}

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
              if (file) uploadImage(el.id, file);
              e.target.value = "";
            }}
          />
        ))}
      </div>

      {/* ── Right: Info + actions ── */}
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-orange-500">₹{product.basePrice}</span>
            <span className="text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-full">🚚 {product.deliveryDays} days delivery</span>
          </div>

          {/* Buy Now / Customize Now */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              onClick={() => addToCart(true)}
              className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-colors"
            >
              <Zap className="w-4 h-4" /> Buy Now
            </button>
            <button
              onClick={() => setCustomizing((c) => !c)}
              className={`flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-colors border-2 ${customizing ? "border-orange-500 bg-orange-50 text-orange-600" : "border-orange-500 bg-orange-500 hover:bg-orange-600 text-white"}`}
            >
              <PenLine className="w-4 h-4" /> {customizing ? "Customizing..." : "Customize Now"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Buy Now = ready design ke saath order • Customize Now = apni photo/text/color lagao
          </p>
        </div>

        {/* Customize panel */}
        {customizing && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-5">
            <h2 className="font-bold text-gray-900">Apna Customization</h2>

            {/* Text inputs */}
            {textBoxes.map((el) => (
              <div key={el.id}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{el.label}</label>
                <div className="relative">
                  <input
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 pr-9"
                    placeholder={el.text}
                    value={overrides[el.id]?.text ?? ""}
                    onChange={(e) => setOverrides((p) => ({ ...p, [el.id]: { ...p[el.id], text: e.target.value } }))}
                  />
                  {overrides[el.id]?.text && (
                    <button
                      onClick={() => setOverrides((p) => ({ ...p, [el.id]: { ...p[el.id], text: undefined } }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Image uploads — dropdown/accordion */}
            {imageBoxes.length > 0 && (
            <details className="border border-gray-200 rounded-xl" open>
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-700 select-none">
                📸 Photos ({imageBoxes.length}) — kholne ke liye click karo
              </summary>
              <div className="p-4 pt-1 space-y-4">
            {imageBoxes.map((el) => (
              <div key={el.id}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{el.label}</label>
                <button
                  onClick={() => fileRefs.current[el.id]?.click()}
                  className="w-full flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-3 hover:border-orange-400 hover:bg-orange-50 transition-colors text-left"
                >
                  {(overrides[el.id]?.image ?? el.defaultImage) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={overrides[el.id]?.image ?? el.defaultImage} alt="" className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><Upload className="w-4 h-4 text-gray-400" /></div>
                  )}
                  <span className="text-sm text-gray-600">
                    {uploading === el.id ? "Uploading..." : overrides[el.id]?.image ? "Photo badli ✓ — phir se change karo" : "Apni photo upload karo"}
                  </span>
                </button>
              </div>
            ))}
              </div>
            </details>
            )}

            {/* Frame Color */}
            {opts && opts.frameColors.allowed.length > 0 && elements.some((e) => e.type === "frame") && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Frame Color</label>
                <div className="flex flex-wrap gap-2">
                  {opts.frameColors.allowed.map((c) => (
                    <button
                      key={c}
                      onClick={() => setFrameColor(c)}
                      style={{ background: c }}
                      className={`w-10 h-10 rounded-xl border-2 transition-transform hover:scale-110 ${(frameColor ?? "") === c ? "border-orange-500 ring-2 ring-orange-200 scale-110" : "border-gray-200"}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Text Color */}
            {opts && opts.textColors.allowed.length > 0 && textBoxes.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Text Color</label>
                <div className="flex flex-wrap gap-2">
                  {opts.textColors.allowed.map((c) => (
                    <button
                      key={c}
                      onClick={() => setTextColor(c)}
                      style={{ background: c }}
                      className={`w-10 h-10 rounded-xl border-2 transition-transform hover:scale-110 ${(textColor ?? "") === c ? "border-orange-500 ring-2 ring-orange-200 scale-110" : "border-gray-200"}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Font Style — dropdown */}
            {opts && opts.fonts.allowed.length > 0 && textBoxes.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Font Style</label>
                <div className="relative">
                  <button
                    onClick={() => setFontOpen((o) => !o)}
                    className="w-full flex items-center justify-between border-2 border-gray-200 rounded-xl px-4 py-3 text-left hover:border-orange-300 transition-colors"
                  >
                    <span style={{ fontFamily: font ?? opts.fonts.default }} className="text-lg">
                      {FONT_LABELS[font ?? opts.fonts.default] ?? opts.customFonts.find((cf) => cf.family === (font ?? opts.fonts.default))?.label ?? "Font choose karo"}
                    </span>
                    <span className="text-gray-400 text-xs">{fontOpen ? "▲" : "▼"}</span>
                  </button>
                  {fontOpen && (
                    <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                      {opts.fonts.allowed.map((f) => {
                        const label = FONT_LABELS[f] ?? opts.customFonts.find((cf) => cf.family === f)?.label ?? f;
                        return (
                          <button
                            key={f}
                            onClick={() => { setFont(f); setFontOpen(false); }}
                            style={{ fontFamily: f }}
                            className={`w-full text-left px-4 py-2.5 text-lg hover:bg-orange-50 transition-colors ${(font ?? "") === f ? "bg-orange-50" : ""}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Text Size */}
            {opts && opts.textSizes.allowed.length > 0 && textBoxes.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Text Size</label>
                <div className="flex flex-wrap gap-2">
                  {opts.textSizes.allowed.map((s) => (
                    <button
                      key={s.px}
                      onClick={() => setTextSize(s.px)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${(textSize ?? 0) === s.px ? "border-orange-500 bg-orange-50 text-orange-600" : "border-gray-200 text-gray-700 hover:border-orange-300"}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quantity + Add to Cart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-700">Quantity</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold hover:border-orange-400 transition-colors">−</button>
              <span className="w-8 text-center font-bold text-lg text-gray-900">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold hover:border-orange-400 transition-colors">+</button>
            </div>
          </div>
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
            <span className="text-gray-600 font-medium">Total Amount</span>
            <span className="text-3xl font-bold text-orange-500">₹{product.basePrice * quantity}</span>
          </div>
          <button
            onClick={() => addToCart(!customizing)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-200"
          >
            <ShoppingCart className="w-5 h-5" /> Add to Cart
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
    </div>
  );
}
