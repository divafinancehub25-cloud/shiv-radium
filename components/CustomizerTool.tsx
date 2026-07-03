"use client";

import { useState, useRef, useMemo } from "react";
import { ShoppingCart, Upload, ChevronDown, ChevronUp, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Field = {
  id: string;
  label: string;
  fieldKey: string;
  type: string;
  placeholder: string | null;
  helpText: string | null;
  isRequired: boolean;
  options: { id: string; label: string; value: string; price: number | null }[];
};

type Product = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  images: string[];
  deliveryDays: number;
  fields: Field[];
  category: { name: string; icon: string | null; slug: string };
  previewPosition?: string;
};

// Default overlay coordinates (%) per admin-set position
const POSITION_DEFAULTS: Record<string, { x: number; y: number }> = {
  top: { x: 50, y: 22 },
  center: { x: 50, y: 50 },
  bottom: { x: 50, y: 78 },
  left: { x: 28, y: 50 },
  right: { x: 72, y: 50 },
};

type LayoutItem = { x: number; y: number; size?: number; scale?: number };

// Map font option values/labels to real font families for live preview
function fontFamilyFor(value: string): string {
  const v = value.toLowerCase();
  if (v.includes("playfair")) return "'Playfair Display', serif";
  if (v.includes("courier")) return "'Courier New', monospace";
  if (v.includes("amatic")) return "'Amatic SC', cursive";
  if (v.includes("dancing")) return "'Dancing Script', cursive";
  if (v.includes("poppins")) return "'Poppins', sans-serif";
  if (v.includes("arial")) return "Arial, sans-serif";
  return value || "inherit";
}

export default function CustomizerTool({ product }: { product: Product }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [fontOpen, setFontOpen] = useState<Record<string, boolean>>({});
  const [qualityWarning, setQualityWarning] = useState<Record<string, string>>({});
  // Drag layout: per element position/size on the preview (percent coords)
  const [layout, setLayout] = useState<Record<string, LayoutItem>>({});
  const previewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<string | null>(null);
  const uploadingRef = useRef(uploading);
  uploadingRef.current = uploading;

  // ── Detect special fields for live preview ──
  const textFields = useMemo(
    () => product.fields.filter((f) => f.type === "TEXT" || f.type === "TEXTAREA"),
    [product.fields]
  );
  const fontField = useMemo(
    () => product.fields.find((f) => f.type === "DROPDOWN" && /font/i.test(f.fieldKey + " " + f.label)),
    [product.fields]
  );
  const textColorField = useMemo(() => {
    const pickers = product.fields.filter((f) => f.type === "COLOR_PICKER");
    return pickers.find((f) => /text/i.test(f.fieldKey + " " + f.label)) ?? pickers[0];
  }, [product.fields]);
  const imageField = useMemo(
    () => product.fields.find((f) => f.type === "IMAGE_UPLOAD"),
    [product.fields]
  );

  const previewFont = fontField ? fontFamilyFor(values[fontField.fieldKey] ?? "") : "inherit";
  const previewColor = textColorField ? (values[textColorField.fieldKey] || "#1a1a1a") : "#1a1a1a";
  const previewImage = imageField ? values[imageField.fieldKey] : null;
  const previewTextLines = textFields
    .map((f) => ({ key: f.fieldKey, text: values[f.fieldKey] ?? "" }))
    .filter((l) => l.text.trim());

  function defaultPos(index: number): { x: number; y: number } {
    const base = POSITION_DEFAULTS[product.previewPosition ?? "center"] ?? POSITION_DEFAULTS.center;
    return { x: base.x, y: Math.min(90, base.y + index * 12) };
  }

  function getPos(key: string, index: number): LayoutItem {
    return layout[key] ?? defaultPos(index);
  }

  function updateLayout(key: string, index: number, patch: Partial<LayoutItem>) {
    setLayout((prev) => ({ ...prev, [key]: { ...defaultPos(index), ...prev[key], ...patch } }));
  }

  function startDrag(key: string, e: React.PointerEvent) {
    e.preventDefault();
    dragRef.current = key;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onDragMove(e: React.PointerEvent) {
    if (!dragRef.current || !previewRef.current) return;
    const r = previewRef.current.getBoundingClientRect();
    const x = Math.max(3, Math.min(97, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.max(3, Math.min(97, ((e.clientY - r.top) / r.height) * 100));
    const key = dragRef.current;
    setLayout((prev) => ({ ...prev, [key]: { ...prev[key], x, y } }));
  }

  function endDrag() {
    dragRef.current = null;
  }

  function setValue(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  // Warn if uploaded photo is too small for a sharp print
  function checkPhotoQuality(fieldKey: string, file: File) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const minSide = Math.min(img.width, img.height);
      if (minSide < 800) {
        setQualityWarning((p) => ({
          ...p,
          [fieldKey]: `⚠️ Photo chhoti hai (${img.width}×${img.height}px) — print blurry aa sakti hai. Behtar quality ke liye badi photo upload karo.`,
        }));
      } else {
        setQualityWarning((p) => ({ ...p, [fieldKey]: "" }));
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  async function handleFileUpload(fieldKey: string, file: File) {
    checkPhotoQuality(fieldKey, file);
    setUploading((prev) => ({ ...prev, [fieldKey]: true }));
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok && data.url) {
      setValue(fieldKey, data.url);
    }
    setUploading((prev) => ({ ...prev, [fieldKey]: false }));
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    for (const field of product.fields) {
      if (field.type === "QUANTITY") continue;
      if (field.isRequired && !values[field.fieldKey]) {
        newErrors[field.fieldKey] = `${field.label} required hai`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function addToCart() {
    if (!validate()) return;
    const existing = JSON.parse(localStorage.getItem("cart") ?? "[]");
    localStorage.setItem("cart", JSON.stringify([
      ...existing,
      {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.images?.[0] ?? null,
        quantity,
        unitPrice: product.basePrice,
        totalPrice: product.basePrice * quantity,
        customizationData: Object.keys(layout).length > 0
          ? { ...values, _layout: JSON.stringify(layout) }
          : values,
      },
    ]));
    router.push("/cart");
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white";
  let sectionNo = 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Google Fonts for live preview */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Amatic+SC:wght@400;700&family=Dancing+Script&family=Poppins:wght@400;600&display=swap"
        rel="stylesheet"
      />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-400">
        <span className="hover:text-orange-500 cursor-pointer" onClick={() => router.push("/")}>Home</span>
        <span className="mx-2">/</span>
        <span className="hover:text-orange-500 cursor-pointer" onClick={() => router.push(`/category/${product.category.slug}`)}>{product.category.name}</span>
        <span className="mx-2">/</span>
        <span className="text-gray-700 font-medium">{product.name}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16 grid lg:grid-cols-2 gap-10">

        {/* ── Left: LIVE PREVIEW ── */}
        <div className="space-y-4">
          <div
            ref={previewRef}
            onPointerMove={onDragMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm relative"
          >
            {product.images?.[selectedImage] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-gray-50">
                <span className="text-8xl">{product.category.icon}</span>
              </div>
            )}

            {/* Live overlay: draggable uploaded photo + text chips */}
            {previewImage && (() => {
              const p = getPos("__photo", 0);
              const scale = layout["__photo"]?.scale ?? 1;
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewImage}
                  alt="Your upload"
                  draggable={false}
                  onPointerDown={(e) => startDrag("__photo", e)}
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    touchAction: "none",
                  }}
                  className="absolute max-w-[55%] max-h-[45%] object-contain rounded shadow-lg cursor-move select-none"
                />
              );
            })()}
            {previewTextLines.map((line, i) => {
              const idx = previewImage ? i + 1 : i;
              const p = getPos(line.key, idx);
              const size = layout[line.key]?.size ?? 26;
              return (
                <div
                  key={line.key}
                  onPointerDown={(e) => startDrag(line.key, e)}
                  style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)", touchAction: "none" }}
                  className="absolute bg-white/85 backdrop-blur-[2px] border border-gray-300 rounded-lg px-3 py-1 flex items-center gap-2 shadow cursor-move select-none"
                >
                  <span
                    className="leading-tight whitespace-nowrap"
                    style={{ fontFamily: previewFont, color: previewColor, fontSize: `${size}px` }}
                  >
                    {line.text}
                  </span>
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setValue(line.key, "")}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            {(previewTextLines.length > 0 || previewImage) && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-3 py-1 rounded-full pointer-events-none">
                ✥ Drag karke jagah set karo
              </div>
            )}

            {/* Live badge */}
            <div className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
              ● Live Preview
            </div>
          </div>

          {/* Thumbnail strip */}
          {product.images?.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${selectedImage === i ? "border-orange-500" : "border-gray-200"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Product info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-orange-500 font-medium mb-2">
              <span>{product.category.icon}</span> {product.category.name}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h1>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-orange-500">₹{product.basePrice}</span>
              <span className="text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-full">🚚 {product.deliveryDays} days delivery</span>
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
              <span>✅ 100% Customized</span>
              <span>🔒 Secure Payment</span>
              <span>⭐ 4.9 Rating</span>
            </div>

            {/* WhatsApp design approval trust badge */}
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2.5">
              <span className="text-xl">💬</span>
              <div>
                <p className="text-sm font-semibold text-green-800">WhatsApp Design Approval</p>
                <p className="text-xs text-green-700 mt-0.5">
                  Order ke baad hum final design WhatsApp pe bhejenge — aapke approval ke baad hi product banega. 100% satisfaction!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Customization Form ── */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Customize Your Order</h2>
            <p className="text-sm text-gray-400 mb-6">Jaise type karoge, waise hi left preview mein dikhega ✨</p>

            <div className="space-y-6">
              {product.fields.map((field) => {
                if (field.type === "QUANTITY") return null;
                sectionNo++;

                return (
                  <div key={field.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">
                        {sectionNo}
                      </span>
                      <label className="text-sm font-bold text-gray-900">
                        {field.label}
                        {field.isRequired && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      {field.helpText && (
                        <span className="text-xs text-gray-400 hidden sm:inline">— {field.helpText}</span>
                      )}
                    </div>

                    {field.type === "TEXT" && (
                      <div>
                        <input
                          type="text"
                          placeholder={field.placeholder ?? "Add your custom text..."}
                          value={values[field.fieldKey] ?? ""}
                          onChange={(e) => setValue(field.fieldKey, e.target.value)}
                          className={inputClass}
                        />
                        {values[field.fieldKey] && (
                          <>
                            <div className="mt-2 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                              <span className="text-sm text-gray-700" style={{ fontFamily: previewFont, color: previewColor }}>
                                {values[field.fieldKey]}
                              </span>
                              <button onClick={() => setValue(field.fieldKey, "")} className="text-gray-400 hover:text-red-500">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            {/* Text size slider */}
                            <div className="mt-2 flex items-center gap-3 px-1">
                              <span className="text-xs text-gray-500 shrink-0">Text Size</span>
                              <input
                                type="range"
                                min={14}
                                max={64}
                                value={layout[field.fieldKey]?.size ?? 26}
                                onChange={(e) => updateLayout(field.fieldKey, textFields.findIndex((tf) => tf.fieldKey === field.fieldKey), { size: Number(e.target.value) })}
                                className="flex-1 accent-orange-500"
                              />
                              <span className="text-xs font-semibold text-gray-700 w-10 text-right">{layout[field.fieldKey]?.size ?? 26}px</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {field.type === "TEXTAREA" && (
                      <textarea
                        placeholder={field.placeholder ?? ""}
                        value={values[field.fieldKey] ?? ""}
                        onChange={(e) => setValue(field.fieldKey, e.target.value)}
                        rows={3}
                        className={inputClass + " resize-none"}
                      />
                    )}

                    {field.type === "DATE" && (
                      <input
                        type="date"
                        value={values[field.fieldKey] ?? ""}
                        onChange={(e) => setValue(field.fieldKey, e.target.value)}
                        className={inputClass}
                      />
                    )}

                    {field.type === "PHONE" && (
                      <input
                        type="tel"
                        placeholder={field.placeholder ?? "10-digit number"}
                        value={values[field.fieldKey] ?? ""}
                        onChange={(e) => setValue(field.fieldKey, e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className={inputClass}
                      />
                    )}

                    {/* Font dropdown — options rendered in their own font */}
                    {field.type === "DROPDOWN" && field === fontField && (
                      <div className="relative">
                        <button
                          onClick={() => setFontOpen((p) => ({ ...p, [field.fieldKey]: !p[field.fieldKey] }))}
                          className={inputClass + " flex items-center justify-between text-left"}
                        >
                          <span style={{ fontFamily: fontFamilyFor(values[field.fieldKey] ?? "") }}>
                            {field.options.find((o) => o.value === values[field.fieldKey])?.label ?? (field.placeholder || "Select font style...")}
                          </span>
                          {fontOpen[field.fieldKey] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>
                        {fontOpen[field.fieldKey] && (
                          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                            {field.options.map((o) => (
                              <button
                                key={o.id}
                                onClick={() => {
                                  setValue(field.fieldKey, o.value);
                                  setFontOpen((p) => ({ ...p, [field.fieldKey]: false }));
                                }}
                                className={`w-full text-left px-4 py-2.5 text-lg hover:bg-orange-50 transition-colors ${values[field.fieldKey] === o.value ? "bg-orange-50" : ""}`}
                                style={{ fontFamily: fontFamilyFor(o.value) }}
                              >
                                {o.label}{o.price ? <span className="text-xs text-gray-400 font-sans"> +₹{o.price}</span> : null}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Normal dropdown */}
                    {field.type === "DROPDOWN" && field !== fontField && (
                      <div className="relative">
                        <select
                          value={values[field.fieldKey] ?? ""}
                          onChange={(e) => setValue(field.fieldKey, e.target.value)}
                          className={inputClass + " appearance-none pr-10"}
                        >
                          <option value="">Select {field.label}...</option>
                          {field.options.map((o) => (
                            <option key={o.id} value={o.value}>
                              {o.label}{o.price ? ` (+₹${o.price})` : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    )}

                    {field.type === "RADIO" && (
                      <div className="flex flex-wrap gap-2">
                        {field.options.map((o) => (
                          <button
                            key={o.id}
                            onClick={() => setValue(field.fieldKey, o.value)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                              values[field.fieldKey] === o.value
                                ? "border-orange-500 bg-orange-50 text-orange-600"
                                : "border-gray-200 text-gray-700 hover:border-orange-300"
                            }`}
                          >
                            {o.label}{o.price ? ` +₹${o.price}` : ""}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Color swatches with names below (like reference) */}
                    {field.type === "COLOR_PICKER" && (
                      <div className="flex flex-wrap gap-4">
                        {field.options.length > 0 ? field.options.map((o) => (
                          <button
                            key={o.id}
                            onClick={() => setValue(field.fieldKey, o.value)}
                            className="flex flex-col items-center gap-1.5 group"
                          >
                            <span
                              style={{ background: o.value }}
                              className={`w-12 h-12 rounded-xl border-2 transition-transform group-hover:scale-110 shadow-sm ${
                                values[field.fieldKey] === o.value ? "border-orange-500 ring-2 ring-orange-200 scale-110" : "border-gray-200"
                              }`}
                            />
                            <span className={`text-[10px] leading-tight text-center max-w-[60px] ${values[field.fieldKey] === o.value ? "text-orange-600 font-semibold" : "text-gray-500"}`}>
                              {o.label}
                            </span>
                          </button>
                        )) : (
                          <input
                            type="color"
                            value={values[field.fieldKey] ?? "#000000"}
                            onChange={(e) => setValue(field.fieldKey, e.target.value)}
                            className="w-16 h-10 rounded-xl border border-gray-200 cursor-pointer"
                          />
                        )}
                      </div>
                    )}

                    {field.type === "IMAGE_UPLOAD" && (
                      <div>
                        <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                            <Upload className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {uploading[field.fieldKey] ? "Uploading..." : values[field.fieldKey] ? "Photo uploaded ✓ (click to change)" : "Upload Image..."}
                            </p>
                            <p className="text-xs text-gray-400">Select or drag an image here — JPG, PNG</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(field.fieldKey, file);
                            }}
                          />
                        </label>
                        {qualityWarning[field.fieldKey] && (
                          <div className="mt-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-xl">
                            {qualityWarning[field.fieldKey]}
                          </div>
                        )}
                        {values[field.fieldKey] && (
                          <div className="mt-2 flex items-center gap-3 px-1">
                            <span className="text-xs text-gray-500 shrink-0">Photo Zoom</span>
                            <input
                              type="range"
                              min={0.5}
                              max={2}
                              step={0.05}
                              value={layout["__photo"]?.scale ?? 1}
                              onChange={(e) => updateLayout("__photo", 0, { scale: Number(e.target.value) })}
                              className="flex-1 accent-orange-500"
                            />
                            <span className="text-xs font-semibold text-gray-700 w-10 text-right">{Math.round((layout["__photo"]?.scale ?? 1) * 100)}%</span>
                          </div>
                        )}
                        {values[field.fieldKey] && (
                          <div className="mt-2 relative inline-block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={values[field.fieldKey]} alt="Uploaded" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                            <button
                              onClick={() => setValue(field.fieldKey, "")}
                              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {errors[field.fieldKey] && (
                      <p className="text-red-500 text-xs mt-1">{errors[field.fieldKey]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quantity & Add to Cart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-semibold text-gray-700">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold hover:border-orange-400 transition-colors"
                >−</button>
                <span className="w-8 text-center font-bold text-lg text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold hover:border-orange-400 transition-colors"
                >+</button>
              </div>
            </div>

            <div className="flex justify-between items-center mb-5 pb-5 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Total Amount</span>
              <span className="text-3xl font-bold text-orange-500">₹{product.basePrice * quantity}</span>
            </div>

            <button
              onClick={addToCart}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-200 text-base"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>

            <div className="grid grid-cols-3 gap-3 mt-4 text-center text-xs text-gray-400">
              <div>🔒 Secure<br />Payment</div>
              <div>🚚 Fast<br />Delivery</div>
              <div>✅ Quality<br />Guaranteed</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
