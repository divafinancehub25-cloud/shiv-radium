"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Upload, X } from "lucide-react";
import FrameDesigner from "./FrameDesigner";

// Quick-add attribute presets (reference: Custom Attribute List)
const ATTRIBUTE_PRESETS: { name: string; field: Omit<Field, "sortOrder"> }[] = [
  {
    name: "Frame Color",
    field: {
      label: "Frame Color", fieldKey: "frame_color", type: "COLOR_PICKER",
      placeholder: "", helpText: "Select a custom color for your frame", isRequired: false,
      options: [
        { label: "Deep Crimson", value: "#9b1b30", price: null },
        { label: "Cerulean Blue", value: "#2a7fc1", price: null },
        { label: "Polished Gold", value: "#d4a437", price: null },
        { label: "Alabaster White", value: "#f2efe6", price: null },
        { label: "Matte Black", value: "#1c1c1c", price: null },
      ],
    },
  },
  {
    name: "Upload Image",
    field: {
      label: "Image Upload", fieldKey: "customer_photo", type: "IMAGE_UPLOAD",
      placeholder: "", helpText: "Select or drag an image here", isRequired: false, options: [],
    },
  },
  {
    name: "Text Box",
    field: {
      label: "Custom Text", fieldKey: "custom_text", type: "TEXT",
      placeholder: "Add new custom text line...", helpText: "", isRequired: false, options: [],
    },
  },
  {
    name: "Text Color",
    field: {
      label: "Text Color", fieldKey: "text_color", type: "COLOR_PICKER",
      placeholder: "", helpText: "", isRequired: false,
      options: [
        { label: "Black", value: "#1c1c1c", price: null },
        { label: "Gold", value: "#d4a437", price: null },
        { label: "White", value: "#ffffff", price: null },
        { label: "Crimson", value: "#9b1b30", price: null },
      ],
    },
  },
  {
    name: "Font Style",
    field: {
      label: "Font Style", fieldKey: "font_style", type: "DROPDOWN",
      placeholder: "Admin Allowed font style", helpText: "", isRequired: false,
      options: [
        { label: "Arial Regular", value: "arial", price: null },
        { label: "Playfair Display Bold", value: "playfair", price: null },
        { label: "Courier New", value: "courier", price: null },
        { label: "Amatic SC", value: "amatic", price: null },
        { label: "Dancing Script", value: "dancing", price: null },
      ],
    },
  },
  {
    name: "Size",
    field: {
      label: "Size", fieldKey: "size", type: "RADIO",
      placeholder: "", helpText: "", isRequired: false,
      options: [
        { label: "XS", value: "xs", price: null },
        { label: "S", value: "s", price: null },
        { label: "M", value: "m", price: null },
        { label: "L", value: "l", price: null },
        { label: "XL", value: "xl", price: null },
        { label: "XXL", value: "xxl", price: null },
      ],
    },
  },
];

const FIELD_TYPES = [
  { value: "TEXT", label: "Text Input" },
  { value: "TEXTAREA", label: "Text Area" },
  { value: "DROPDOWN", label: "Dropdown" },
  { value: "RADIO", label: "Radio Buttons" },
  { value: "IMAGE_UPLOAD", label: "Image Upload" },
  { value: "COLOR_PICKER", label: "Color Picker" },
  { value: "DATE", label: "Date Picker" },
  { value: "QUANTITY", label: "Quantity" },
];

type Option = { id?: string; label: string; value: string; price: number | null };
type Field = {
  id?: string;
  label: string;
  fieldKey: string;
  type: string;
  placeholder: string | null;
  helpText: string | null;
  isRequired: boolean;
  sortOrder: number;
  maxFiles?: number;
  options: Option[];
};

type Features = { drag: boolean; textSize: boolean; photoZoom: boolean; whatsappBadge: boolean };
const DEFAULT_FEATURES: Features = { drag: true, textSize: true, photoZoom: true, whatsappBadge: true };
const FEATURE_LABELS: { key: keyof Features; label: string; desc: string }[] = [
  { key: "drag", label: "🖐️ Drag & Drop", desc: "Customer text/photo ko preview pe khich sake" },
  { key: "textSize", label: "🔠 Text Size Slider", desc: "Text chhota/bada karne ka slider" },
  { key: "photoZoom", label: "🔍 Photo Zoom", desc: "Photo zoom in/out slider" },
  { key: "whatsappBadge", label: "💬 WhatsApp Approval Badge", desc: "Design approval trust badge" },
];
type Category = { id: string; name: string; icon: string | null };
type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  categoryId: string;
  deliveryDays: number;
  isActive: boolean;
  isFeatured: boolean;
  images: string[];
  fields: Field[];
  previewPosition?: string;
  features?: Partial<Features> | null;
  sampleDesigns?: string[];
};

const PREVIEW_POSITIONS = [
  { value: "top", label: "⬆️ Top", desc: "Text upar dikhega" },
  { value: "center", label: "⏺️ Center", desc: "Text beech mein" },
  { value: "bottom", label: "⬇️ Bottom", desc: "Text niche" },
  { value: "left", label: "⬅️ Left", desc: "Text left side" },
  { value: "right", label: "➡️ Right", desc: "Text right side" },
];

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function ProductForm({ categories, product }: { categories: Category[]; product?: Product }) {
  const router = useRouter();
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    basePrice: product?.basePrice?.toString() ?? "",
    categoryId: product?.categoryId ?? "",
    deliveryDays: product?.deliveryDays?.toString() ?? "5",
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    previewPosition: product?.previewPosition ?? "center",
  });

  const [fields, setFields] = useState<Field[]>(
    product?.fields ?? []
  );

  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [sampleDesigns, setSampleDesigns] = useState<string[]>(product?.sampleDesigns ?? []);
  const [features, setFeatures] = useState<Features>({ ...DEFAULT_FEATURES, ...(product?.features ?? {}) });
  const [uploadingSample, setUploadingSample] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedField, setExpandedField] = useState<number | null>(null);

  async function handleSampleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSample(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok && data.url) setSampleDesigns((prev) => [...prev, data.url]);
    else setError("Sample upload failed");
    setUploadingSample(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok && data.url) setImages((prev) => [...prev, data.url]);
    else setError("Image upload failed");
    setUploading(false);
  }

  function setFormValue(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addField() {
    const newField: Field = {
      label: "",
      fieldKey: "",
      type: "TEXT",
      placeholder: "",
      helpText: "",
      isRequired: false,
      sortOrder: fields.length,
      options: [],
    };
    setFields((prev) => [...prev, newField]);
    setExpandedField(fields.length);
  }

  function addPreset(preset: typeof ATTRIBUTE_PRESETS[number]) {
    // Avoid duplicate fieldKey — append number if needed
    let key = preset.field.fieldKey;
    let n = 2;
    while (fields.some((f) => f.fieldKey === key)) {
      key = `${preset.field.fieldKey}_${n++}`;
    }
    setFields((prev) => [...prev, { ...preset.field, fieldKey: key, sortOrder: prev.length, options: preset.field.options.map((o) => ({ ...o })) }]);
    setExpandedField(fields.length);
  }

  function updateField(index: number, key: string, value: string | boolean) {
    setFields((prev) => prev.map((f, i) => {
      if (i !== index) return f;
      const updated = { ...f, [key]: value };
      if (key === "label" && !f.fieldKey) {
        updated.fieldKey = slugify(value as string);
      }
      return updated;
    }));
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  function addOption(fieldIndex: number) {
    setFields((prev) => prev.map((f, i) => {
      if (i !== fieldIndex) return f;
      return { ...f, options: [...f.options, { label: "", value: "", price: null }] };
    }));
  }

  function updateOption(fieldIndex: number, optIndex: number, key: string, value: string) {
    setFields((prev) => prev.map((f, i) => {
      if (i !== fieldIndex) return f;
      return {
        ...f,
        options: f.options.map((o, oi) => {
          if (oi !== optIndex) return o;
          const updated = { ...o, [key]: value };
          if (key === "label" && !o.value) updated.value = slugify(value);
          return updated;
        }),
      };
    }));
  }

  function removeOption(fieldIndex: number, optIndex: number) {
    setFields((prev) => prev.map((f, i) => {
      if (i !== fieldIndex) return f;
      return { ...f, options: f.options.filter((_, oi) => oi !== optIndex) };
    }));
  }

  async function handleSubmit() {
    if (!form.name || !form.categoryId || !form.basePrice) {
      setError("Name, category aur price zaroori hain");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const url = isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, images, fields, features, sampleDesigns }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? "Edit Product" : "Add Product"}</h1>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>
      )}

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Basic Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
              <input
                className={inputClass}
                placeholder="e.g. Custom Name Plate"
                value={form.name}
                onChange={(e) => {
                  setFormValue("name", e.target.value);
                  if (!isEdit) setFormValue("slug", slugify(e.target.value));
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Slug *</label>
              <input
                className={inputClass}
                placeholder="custom-name-plate"
                value={form.slug}
                onChange={(e) => setFormValue("slug", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
              <select className={inputClass + " bg-white"} value={form.categoryId} onChange={(e) => setFormValue("categoryId", e.target.value)}>
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Base Price (₹) *</label>
              <input
                className={inputClass}
                type="number"
                placeholder="500"
                value={form.basePrice}
                onChange={(e) => setFormValue("basePrice", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Days</label>
              <input
                className={inputClass}
                type="number"
                placeholder="5"
                value={form.deliveryDays}
                onChange={(e) => setFormValue("deliveryDays", e.target.value)}
              />
            </div>
            <div className="flex items-center gap-6 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setFormValue("isActive", e.target.checked)} className="w-4 h-4 accent-orange-500" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setFormValue("isFeatured", e.target.checked)} className="w-4 h-4 accent-orange-500" />
                <span className="text-sm text-gray-700">Featured ⭐</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                className={inputClass + " resize-none"}
                rows={3}
                placeholder="Product description..."
                value={form.description}
                onChange={(e) => setFormValue("description", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Product Images</h2>
          <div className="flex flex-wrap gap-3 mb-4">
            {images.map((img, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 transition-colors">
              {uploading ? (
                <span className="text-xs text-gray-400">Uploading...</span>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-gray-300 mb-1" />
                  <span className="text-xs text-gray-400">Add Image</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          </div>
          <p className="text-xs text-gray-400">Pehli image main product image hogi</p>
        </div>

        {/* Live Preview Position */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Live Preview — Text Position</h2>
          <p className="text-xs text-gray-400 mb-4">Customer ka text/photo product image pe kahan dikhega (mug pe side, frame ke andar, plate pe niche...)</p>
          <div className="flex flex-wrap gap-2">
            {PREVIEW_POSITIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => setFormValue("previewPosition", p.value)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                  form.previewPosition === p.value
                    ? "border-orange-500 bg-orange-50 text-orange-600"
                    : "border-gray-200 text-gray-600 hover:border-orange-300"
                }`}
                title={p.desc}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customizer Feature Toggles */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Customizer Features — On/Off</h2>
          <p className="text-xs text-gray-400 mb-4">Is product ke customer page pe kaun se features chalenge</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FEATURE_LABELS.map((f) => (
              <label
                key={f.key}
                className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-colors ${
                  features[f.key] ? "border-orange-400 bg-orange-50" : "border-gray-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={features[f.key]}
                  onChange={(e) => setFeatures((prev) => ({ ...prev, [f.key]: e.target.checked }))}
                  className="w-4 h-4 accent-orange-500 mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{f.label}</p>
                  <p className="text-xs text-gray-400">{f.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Frame Designer — admin drag-drop template builder */}
        {isEdit ? (
          <FrameDesigner productId={product!.id} productImage={images[0] ?? null} />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">🖼️ Frame Designer</h2>
            <p className="text-xs text-gray-400">Pehle product create karo — uske baad edit mein Frame Designer khulega</p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-orange-100"
          >
            {loading ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
