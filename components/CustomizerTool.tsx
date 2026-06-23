"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ShoppingCart, Upload, Lock, Save, Plus, Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

const FONTS = [
  { label: "Modern Serif", value: "Georgia, serif" },
  { label: "Bold", value: "Arial Black, sans-serif" },
  { label: "Script", value: "cursive" },
  { label: "Italic", value: "Georgia, serif", italic: true },
  { label: "Kena", value: "Palatino, serif" },
];

const COLORS = [
  "#D32F2F", "#E91E63", "#9C27B0", "#673AB7",
  "#3F51B5", "#2196F3", "#00BCD4", "#009688",
  "#4CAF50", "#8BC34A", "#CDDC39", "#FFC107",
  "#FF9800", "#FF5722", "#795548", "#000000",
  "#FFFFFF", "#607D8B", "#FFD700", "#C0C0C0",
];

type Field = {
  id: string;
  label: string;
  fieldKey: string;
  type: string;
  placeholder: string | null;
  isRequired: boolean;
  options: { id: string; label: string; value: string; price: number | null }[];
};

type Product = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  images: string[];
  fields: Field[];
  category: { name: string; icon: string | null };
};

export default function CustomizerTool({ product }: { product: Product }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const productImgRef = useRef<HTMLImageElement | null>(null);

  const [textBoxes, setTextBoxes] = useState([
    { id: "t1", value: "", placeholder: "Your Name / Line 1" },
    { id: "t2", value: "", placeholder: "Line 2 (optional)" },
  ]);
  const [font, setFont] = useState(FONTS[0]);
  const [textColor, setTextColor] = useState("#FFD700");
  const [bgColor, setBgColor] = useState("#1a1a2e");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [textSize, setTextSize] = useState(36);
  const [values, setValues] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [locked, setLocked] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"text" | "style" | "image">("text");

  // Preload product image
  useEffect(() => {
    if (product.images?.[0]) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { productImgRef.current = img; drawCanvas(); };
      img.src = product.images[0];
    }
  }, [product.images]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Draw product image as background if available
    if (productImgRef.current) {
      const img = productImgRef.current;
      const scale = Math.max(W / img.width, H / img.height);
      const iw = img.width * scale;
      const ih = img.height * scale;
      ctx.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih);
      // Slight overlay for text readability
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, 0, W, H);
    } else {
      // Fallback solid background
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.roundRect(10, 10, W - 20, H - 20, 16);
      ctx.fill();
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(18, 18, W - 36, H - 36, 12);
      ctx.stroke();
      ctx.strokeStyle = textColor + "88";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(26, 26, W - 52, H - 52, 8);
      ctx.stroke();
    }

    // Uploaded user image overlay
    if (uploadedImage) {
      const img = new window.Image();
      img.onload = () => {
        const maxW = W * 0.35;
        const maxH = H * 0.5;
        const scale = Math.min(maxW / img.width, maxH / img.height);
        const iw = img.width * scale;
        const ih = img.height * scale;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(W * 0.05, H * 0.1, iw, ih, 8);
        ctx.clip();
        ctx.drawImage(img, W * 0.05, H * 0.1, iw, ih);
        ctx.restore();
        drawTexts(ctx, W, H);
      };
      img.src = uploadedImage;
    } else {
      drawTexts(ctx, W, H);
    }
  }, [bgColor, textColor, textBoxes, font, uploadedImage, textSize]);

  function drawTexts(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const lines = textBoxes.map((t) => t.value).filter(Boolean);
    if (lines.length === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = `18px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.fillText("Your text will appear here", W / 2, H / 2);
      return;
    }

    const spacing = H / (lines.length + 1);
    lines.forEach((line, i) => {
      const fontSize = textSize;
      ctx.fillStyle = textColor;
      ctx.font = `${font.italic ? "italic " : ""}bold ${fontSize}px ${font.value}`;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 6;
      ctx.fillText(line, W / 2, spacing * (i + 1) + fontSize / 3);
      ctx.shadowBlur = 0;
    });

    // Decorative line
    if (lines.length > 0) {
      ctx.strokeStyle = textColor + "99";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(W * 0.25, H * 0.78);
      ctx.lineTo(W * 0.75, H * 0.78);
      ctx.stroke();
      ctx.fillStyle = textColor + "cc";
      ctx.font = `11px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.fillText("— SHIV RADIUM —", W / 2, H * 0.87);
    }
  }

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  function addTextBox() {
    if (textBoxes.length >= 4) return;
    setTextBoxes((prev) => [
      ...prev,
      { id: `t${prev.length + 1}`, value: "", placeholder: `Line ${prev.length + 1}` },
    ]);
  }

  function removeTextBox(id: string) {
    if (textBoxes.length <= 1) return;
    setTextBoxes((prev) => prev.filter((t) => t.id !== id));
  }

  function updateText(id: string, value: string) {
    setTextBoxes((prev) => prev.map((t) => (t.id === id ? { ...t, value } : t)));
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedImage(url);
    setValue("photo", url);
  }

  function setValue(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function lockFormat() {
    setLocked(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setValue("canvas_preview", dataUrl);
    setValue("design_json", JSON.stringify({ textBoxes, font: font.label, textColor, bgColor, textSize }));
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    for (const field of product.fields) {
      if (["QUANTITY", "IMAGE_UPLOAD", "TEXT"].includes(field.type)) continue;
      if (field.isRequired && !values[field.fieldKey]) {
        newErrors[field.fieldKey] = `${field.label} zaroori hai`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function addToCart() {
    if (!validate()) return;
    const allValues = {
      ...values,
      ...Object.fromEntries(textBoxes.map((t) => [t.id, t.value])),
      font: font.label, textColor, bgColor,
    };
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
        customizationData: allValues,
      },
    ]));
    router.push("/cart");
  }

  const tabs = [
    { id: "text", label: "✏️ Text" },
    { id: "style", label: "🎨 Style" },
    { id: "image", label: "🖼️ Image" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">{product.category.icon} {product.category.name}</p>
          <p className="font-bold text-gray-900">{product.name}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Starting from</p>
          <p className="text-2xl font-bold text-orange-500">₹{product.basePrice}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-[1fr_400px] gap-6">

        {/* Left: Canvas Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Live Preview
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setTextSize(s => Math.max(16, s - 4))} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Smaller text">
                  <ZoomOut className="w-4 h-4 text-gray-500" />
                </button>
                <span className="text-xs text-gray-400">{textSize}px</span>
                <button onClick={() => setTextSize(s => Math.min(72, s + 4))} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Larger text">
                  <ZoomIn className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={() => { setTextBoxes([{ id: "t1", value: "", placeholder: "Your Name / Line 1" }, { id: "t2", value: "", placeholder: "Line 2 (optional)" }]); setUploadedImage(null); setLocked(false); }} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Reset">
                  <RotateCcw className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
            <canvas
              ref={canvasRef}
              width={640}
              height={360}
              className="w-full rounded-xl border border-gray-100 shadow-sm"
              style={{ background: "#f8f8f8" }}
            />
            {locked && (
              <div className="mt-3 flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2.5 rounded-xl">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">Design locked! Ab cart mein add karo.</span>
              </div>
            )}
          </div>

          {/* Color pickers — only show when style tab active on mobile, always visible on desktop */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 hidden lg:block">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Background Color</p>
                <div className="flex flex-wrap gap-1.5">
                  {COLORS.map((c) => (
                    <button key={c} style={{ background: c, border: bgColor === c ? "3px solid #FF6B2C" : "2px solid #e5e7eb" }}
                      className="w-7 h-7 rounded-lg transition-transform hover:scale-110" onClick={() => setBgColor(c)} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Text Color</p>
                <div className="flex flex-wrap gap-1.5">
                  {COLORS.map((c) => (
                    <button key={c} style={{ background: c, border: textColor === c ? "3px solid #FF6B2C" : "2px solid #e5e7eb" }}
                      className="w-7 h-7 rounded-lg transition-transform hover:scale-110" onClick={() => setTextColor(c)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Tools Panel */}
        <div className="space-y-4">

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-100">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? "text-orange-500 border-b-2 border-orange-500 bg-orange-50" : "text-gray-500 hover:text-gray-700"}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {/* TEXT TAB */}
              {activeTab === "text" && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Text Lines</p>
                  {textBoxes.map((t) => (
                    <div key={t.id} className="flex gap-2">
                      <input type="text" placeholder={t.placeholder} value={t.value}
                        onChange={(e) => updateText(t.id, e.target.value)}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      {textBoxes.length > 1 && (
                        <button onClick={() => removeTextBox(t.id)} className="text-gray-300 hover:text-red-400 px-2">✕</button>
                      )}
                    </div>
                  ))}
                  {errors.text && <p className="text-red-500 text-xs">{errors.text}</p>}
                  {textBoxes.length < 4 && (
                    <button onClick={addTextBox} className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600 text-sm font-medium">
                      <Plus className="w-4 h-4" /> Add another line
                    </button>
                  )}

                  {/* Font selector */}
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Font Style</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {FONTS.map((f) => (
                        <button key={f.label} onClick={() => setFont(f)}
                          style={{ fontFamily: f.value, fontStyle: f.italic ? "italic" : "normal" }}
                          className={`px-2 py-2 rounded-xl text-xs font-medium transition-colors ${font.label === f.label ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-orange-50"}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Extra fields */}
                  {product.fields.filter(f => !["TEXT", "IMAGE_UPLOAD"].includes(f.type)).map((field) => (
                    <div key={field.id} className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 font-medium mb-1.5">{field.label}</p>
                      {field.type === "DROPDOWN" && (
                        <select value={values[field.fieldKey] ?? ""} onChange={(e) => setValue(field.fieldKey, e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                          <option value="">Select...</option>
                          {field.options.map((o) => <option key={o.id} value={o.value}>{o.label}</option>)}
                        </select>
                      )}
                      {field.type === "RADIO" && (
                        <div className="flex flex-wrap gap-1.5">
                          {field.options.map((o) => (
                            <button key={o.id} onClick={() => setValue(field.fieldKey, o.value)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium border ${values[field.fieldKey] === o.value ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-700 hover:border-orange-300"}`}>
                              {o.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {errors[field.fieldKey] && <p className="text-red-500 text-xs mt-1">{errors[field.fieldKey]}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* STYLE TAB */}
              {activeTab === "style" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Background Color</p>
                    <div className="flex flex-wrap gap-1.5">
                      {COLORS.map((c) => (
                        <button key={c} style={{ background: c, border: bgColor === c ? "3px solid #FF6B2C" : "2px solid #e5e7eb" }}
                          className="w-8 h-8 rounded-lg transition-transform hover:scale-110" onClick={() => setBgColor(c)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Text Color</p>
                    <div className="flex flex-wrap gap-1.5">
                      {COLORS.map((c) => (
                        <button key={c} style={{ background: c, border: textColor === c ? "3px solid #FF6B2C" : "2px solid #e5e7eb" }}
                          className="w-8 h-8 rounded-lg transition-transform hover:scale-110" onClick={() => setTextColor(c)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Text Size</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setTextSize(s => Math.max(16, s - 4))} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50">−</button>
                      <span className="flex-1 text-center font-bold text-gray-900">{textSize}px</span>
                      <button onClick={() => setTextSize(s => Math.min(72, s + 4))} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50">+</button>
                    </div>
                  </div>
                </div>
              )}

              {/* IMAGE TAB */}
              {activeTab === "image" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Upload Your Photo</p>
                    <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl p-8 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">Click to upload photo</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG supported</p>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    {uploadedImage && (
                      <div className="mt-3 flex items-center justify-between bg-green-50 px-3 py-2 rounded-xl">
                        <span className="text-xs text-green-600 font-medium">Photo uploaded ✓</span>
                        <button onClick={() => { setUploadedImage(null); setValue("photo", ""); }} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Upload Logo / Design</p>
                    <label className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">Upload logo or artwork</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lock & Save */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => drawCanvas()}
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium py-3 rounded-xl transition-colors">
              <Save className="w-4 h-4" /> Refresh
            </button>
            <button onClick={lockFormat}
              className={`flex items-center justify-center gap-2 text-sm font-medium py-3 rounded-xl transition-colors ${locked ? "bg-green-500 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"}`}>
              <Lock className="w-4 h-4" />
              {locked ? "Locked ✓" : "Lock Design"}
            </button>
          </div>

          {/* Quantity & Add to Cart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-700">Quantity</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-lg hover:bg-gray-50">−</button>
                <span className="w-8 text-center font-bold text-gray-900">{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-lg hover:bg-gray-50">+</button>
              </div>
            </div>
            <div className="flex justify-between font-bold text-xl text-gray-900 mb-5">
              <span>Total</span>
              <span className="text-orange-500">₹{product.basePrice * quantity}</span>
            </div>
            <button onClick={addToCart}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-200 text-base">
              <ShoppingCart className="w-5 h-5" /> Add to Cart
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">🚚 Pan India Delivery • 100% Satisfaction</p>
          </div>
        </div>
      </div>
    </div>
  );
}
