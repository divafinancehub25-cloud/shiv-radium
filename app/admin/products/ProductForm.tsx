"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";

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
  options: Option[];
};
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
  fields: Field[];
};

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
  });

  const [fields, setFields] = useState<Field[]>(
    product?.fields ?? []
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedField, setExpandedField] = useState<number | null>(null);

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
        body: JSON.stringify({ ...form, fields }),
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

        {/* Custom Fields */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Customization Fields</h2>
              <p className="text-xs text-gray-400 mt-0.5">Customer ko order karte waqt kya fill karna hoga</p>
            </div>
            <button
              onClick={addField}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Field
            </button>
          </div>

          {fields.length === 0 && (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-sm">Koi field nahi hai</p>
              <p className="text-xs mt-1">Add Field button se fields add karo</p>
            </div>
          )}

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Field Header */}
                <div
                  className="flex items-center gap-3 p-3 bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedField(expandedField === index ? null : index)}
                >
                  <GripVertical className="w-4 h-4 text-gray-300" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {field.label || `Field ${index + 1}`}
                    </p>
                    <p className="text-xs text-gray-400">{FIELD_TYPES.find(t => t.value === field.type)?.label ?? field.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {field.isRequired && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Required</span>}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeField(index); }}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {expandedField === index ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Field Body */}
                {expandedField === index && (
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Field Label *</label>
                        <input
                          className={inputClass}
                          placeholder="e.g. Your Name"
                          value={field.label}
                          onChange={(e) => updateField(index, "label", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Field Key</label>
                        <input
                          className={inputClass}
                          placeholder="your_name"
                          value={field.fieldKey}
                          onChange={(e) => updateField(index, "fieldKey", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Field Type</label>
                        <select
                          className={inputClass + " bg-white"}
                          value={field.type}
                          onChange={(e) => updateField(index, "type", e.target.value)}
                        >
                          {FIELD_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Placeholder</label>
                        <input
                          className={inputClass}
                          placeholder="Placeholder text..."
                          value={field.placeholder ?? ""}
                          onChange={(e) => updateField(index, "placeholder", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Help Text</label>
                        <input
                          className={inputClass}
                          placeholder="e.g. Enter the name to be engraved"
                          value={field.helpText ?? ""}
                          onChange={(e) => updateField(index, "helpText", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.isRequired}
                            onChange={(e) => updateField(index, "isRequired", e.target.checked)}
                            className="w-4 h-4 accent-orange-500"
                          />
                          <span className="text-sm text-gray-700">Required field</span>
                        </label>
                      </div>
                    </div>

                    {/* Options for Dropdown/Radio */}
                    {(field.type === "DROPDOWN" || field.type === "RADIO") && (
                      <div className="border-t border-gray-100 pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-gray-500">Options</p>
                          <button
                            onClick={() => addOption(index)}
                            className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Option
                          </button>
                        </div>
                        <div className="space-y-2">
                          {field.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <input
                                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                                placeholder="Label (e.g. Gold)"
                                value={opt.label}
                                onChange={(e) => updateOption(index, oi, "label", e.target.value)}
                              />
                              <input
                                className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                                placeholder="Value"
                                value={opt.value}
                                onChange={(e) => updateOption(index, oi, "value", e.target.value)}
                              />
                              <input
                                className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                                placeholder="+₹ price"
                                type="number"
                                value={opt.price ?? ""}
                                onChange={(e) => updateOption(index, oi, "price", e.target.value)}
                              />
                              <button onClick={() => removeOption(index, oi)} className="text-gray-300 hover:text-red-500">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

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
