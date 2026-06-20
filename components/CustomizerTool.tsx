"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ShoppingCart, Upload, Lock, Save, Plus, Image as ImageIcon } from "lucide-react";
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
  fields: Field[];
  category: { name: string; icon: string };
};

export default function CustomizerTool({ product }: { product: Product }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [textBoxes, setTextBoxes] = useState([
    { id: "t1", value: "", placeholder: "Text Box 1" },
    { id: "t2", value: "", placeholder: "Text Box 2" },
  ]);
  const [font, setFont] = useState(FONTS[0]);
  const [textColor, setTextColor] = useState("#FFD700");
  const [bgColor, setBgColor] = useState("#1a1a2e");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [locked, setLocked] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(10, 10, W - 20, H - 20, 16);
    ctx.fill();

    // Border
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(18, 18, W - 36, H - 36, 12);
    ctx.stroke();

    // Inner decorative border
    ctx.strokeStyle = textColor + "88";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(26, 26, W - 52, H - 52, 8);
    ctx.stroke();

    // Uploaded image
    if (uploadedImage) {
      const img = new window.Image();
      img.onload = () => {
        const maxW = W * 0.4;
        const maxH = H * 0.6;
        const scale = Math.min(maxW / img.width, maxH / img.height);
        const iw = img.width * scale;
        const ih = img.height * scale;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect((W - iw) / 2, (H - ih) / 2, iw, ih, 8);
        ctx.clip();
        ctx.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih);
        ctx.restore();
        drawTexts(ctx, W, H);
      };
      img.src = uploadedImage;
    } else {
      drawTexts(ctx, W, H);
    }
  }, [bgColor, textColor, textBoxes, font, uploadedImage]);

  function drawTexts(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const lines = textBoxes.map((t) => t.value).filter(Boolean);
    if (lines.length === 0) {
      ctx.fillStyle = textColor + "44";
      ctx.font = `18px ${font.value}`;
      ctx.textAlign = "center";
      ctx.fillText("Your text will appear here", W / 2, H / 2);
      return;
    }

    const spacing = H / (lines.length + 1);
    lines.forEach((line, i) => {
      const fontSize = lines.length === 1 ? 42 : 32;
      ctx.fillStyle = textColor;
      ctx.font = `${font.italic ? "italic " : ""}${fontSize}px ${font.value}`;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.fillText(line.toUpperCase(), W / 2, spacing * (i + 1) + fontSize / 3);
      ctx.shadowBlur = 0;
    });

    // Decorative line under last text
    if (lines.length > 0) {
      ctx.strokeStyle = textColor + "88";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W * 0.3, H * 0.7);
      ctx.lineTo(W * 0.7, H * 0.7);
      ctx.stroke();

      // EST. text
      ctx.fillStyle = textColor + "99";
      ctx.font = `12px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.fillText("— SHIV RADIUM —", W / 2, H * 0.8);
    }
  }

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  function addTextBox() {
    if (textBoxes.length >= 4) return;
    setTextBoxes((prev) => [
      ...prev,
      { id: `t${prev.length + 1}`, value: "", placeholder: `Text Box ${prev.length + 1}` },
    ]);
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
    setValue("design_json", JSON.stringify({
      textBoxes,
      font: font.label,
      textColor,
      bgColor,
    }));
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    for (const field of product.fields) {
      if (field.type === "QUANTITY") continue;
      if (field.type === "IMAGE_UPLOAD" || field.type === "TEXT") continue;
      if (field.isRequired && !values[field.fieldKey]) {
        newErrors[field.fieldKey] = `${field.label} zaroori hai`;
      }
    }
    if (textBoxes.every((t) => !t.value)) {
      newErrors["text"] = "Kam se kam ek text box bharo";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function addToCart() {
    if (!validate()) return;
    const allValues = {
      ...values,
      ...Object.fromEntries(textBoxes.map((t) => [t.id, t.value])),
      font: font.label,
      textColor,
      bgColor,
    };
    const unitPrice = product.basePrice;
    const existing = JSON.parse(localStorage.getItem("cart") ?? "[]");
    localStorage.setItem("cart", JSON.stringify([
      ...existing,
      {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
        customizationData: allValues,
      },
    ]));
    router.push("/cart");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Customize</p>
          <p className="font-bold text-gray-900">{product.name}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Starting from</p>
          <p className="text-2xl font-bold text-gray-900">₹{product.basePrice}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-[1fr_380px] gap-6">

        {/* Left: Canvas Preview */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live Canvas Preview
            </p>
            <canvas
              ref={canvasRef}
              width={600}
              height={320}
              className="w-full rounded-xl border border-gray-100"
              style={{ background: "#f8f8f8" }}
            />
            {locked && (
              <div className="mt-3 flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">Design locked! Add to cart karo.</span>
              </div>
            )}
          </div>

          {/* Color selectors */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Background Color</p>
                <div className="flex flex-wrap gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      style={{ background: c, border: bgColor === c ? "3px solid #FF6B2C" : "2px solid #e5e7eb" }}
                      className="w-7 h-7 rounded-lg transition-transform hover:scale-110"
                      onClick={() => setBgColor(c)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Text Color</p>
                <div className="flex flex-wrap gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      style={{ background: c, border: textColor === c ? "3px solid #FF6B2C" : "2px solid #e5e7eb" }}
                      className="w-7 h-7 rounded-lg transition-transform hover:scale-110"
                      onClick={() => setTextColor(c)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Tools Panel */}
        <div className="space-y-4">
          <div className="bg-gray-900 text-white rounded-2xl p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Tools Panel</p>

            {/* Text Inputs */}
            <div className="space-y-2 mb-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Text Inputs</p>
              {textBoxes.map((t) => (
                <input
                  key={t.id}
                  type="text"
                  placeholder={t.placeholder}
                  value={t.value}
                  onChange={(e) => updateText(t.id, e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
              ))}
              {errors.text && <p className="text-red-400 text-xs">{errors.text}</p>}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={addTextBox}
                disabled={textBoxes.length >= 4}
                className="flex flex-col items-center gap-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 rounded-xl p-2.5 transition-colors"
              >
                <Plus className="w-4 h-4 text-orange-400" />
                <span className="text-[10px] text-gray-400 text-center leading-tight">Add Text Box</span>
              </button>
              <label className="flex flex-col items-center gap-1 bg-gray-800 hover:bg-gray-700 rounded-xl p-2.5 transition-colors cursor-pointer">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] text-gray-400 text-center leading-tight">Add Image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              <label className="flex flex-col items-center gap-1 bg-gray-800 hover:bg-gray-700 rounded-xl p-2.5 transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-green-400" />
                <span className="text-[10px] text-gray-400 text-center leading-tight">Upload Logo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

            {/* Font Panel */}
            <div className="mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Text Font / Style</p>
              <select
                value={font.label}
                onChange={(e) => setFont(FONTS.find((f) => f.label === e.target.value) ?? FONTS[0])}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 mb-2"
              >
                {FONTS.map((f) => (
                  <option key={f.label} value={f.label}>{f.label}</option>
                ))}
              </select>
              <div className="grid grid-cols-3 gap-1.5">
                {FONTS.map((f) => (
                  <button
                    key={f.label}
                    onClick={() => setFont(f)}
                    style={{ fontFamily: f.value, fontStyle: f.italic ? "italic" : "normal" }}
                    className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${
                      font.label === f.label
                        ? "bg-orange-500 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Extra fields from DB */}
            {product.fields.filter(f => !["TEXT", "IMAGE_UPLOAD"].includes(f.type)).map((field) => (
              <div key={field.id} className="mb-3">
                <p className="text-xs text-gray-400 mb-1">{field.label}</p>
                {field.type === "DROPDOWN" && (
                  <select
                    value={values[field.fieldKey] ?? ""}
                    onChange={(e) => setValue(field.fieldKey, e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Select...</option>
                    {field.options.map((o) => (
                      <option key={o.id} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                )}
                {field.type === "RADIO" && (
                  <div className="flex flex-wrap gap-1.5">
                    {field.options.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => setValue(field.fieldKey, o.value)}
                        className={`px-3 py-1 rounded-lg text-xs ${
                          values[field.fieldKey] === o.value
                            ? "bg-orange-500 text-white"
                            : "bg-gray-800 text-gray-300"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
                {errors[field.fieldKey] && <p className="text-red-400 text-xs mt-1">{errors[field.fieldKey]}</p>}
              </div>
            ))}

            {/* Lock Format & Save */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => drawCanvas()}
                className="flex items-center justify-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium py-2.5 rounded-xl transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Save Layout
              </button>
              <button
                onClick={lockFormat}
                className={`flex items-center justify-center gap-1.5 text-xs font-medium py-2.5 rounded-xl transition-colors ${
                  locked
                    ? "bg-green-600 text-white"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Lock Format
              </button>
            </div>
          </div>

          {/* Quantity & Add to Cart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-700">Quantity</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-lg hover:bg-gray-50"
                >
                  −
                </button>
                <span className="w-8 text-center font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-lg hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex justify-between font-bold text-lg text-gray-900 mb-4">
              <span>Total</span>
              <span>₹{product.basePrice * quantity}</span>
            </div>

            <button
              onClick={addToCart}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-200"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
