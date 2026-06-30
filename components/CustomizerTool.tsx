"use client";

import { useState, useRef } from "react";
import { ShoppingCart, Upload, ChevronDown } from "lucide-react";
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
};

export default function CustomizerTool({ product }: { product: Product }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const uploadingRef = useRef(uploading);
  uploadingRef.current = uploading;

  function setValue(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function handleFileUpload(fieldKey: string, file: File) {
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
        customizationData: values,
      },
    ]));
    router.push("/cart");
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-400">
        <span className="hover:text-orange-500 cursor-pointer" onClick={() => router.push("/")}>Home</span>
        <span className="mx-2">/</span>
        <span className="hover:text-orange-500 cursor-pointer" onClick={() => router.push(`/category/${product.category.slug}`)}>{product.category.name}</span>
        <span className="mx-2">/</span>
        <span className="text-gray-700 font-medium">{product.name}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16 grid lg:grid-cols-2 gap-10">

        {/* Left: Product Image */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
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
          </div>
        </div>

        {/* Right: Customization Form */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Customize Your Order</h2>
            <p className="text-sm text-gray-400 mb-6">Fill in the details below — we&apos;ll craft it exactly as you want</p>

            <div className="space-y-5">
              {product.fields.map((field) => {
                if (field.type === "QUANTITY") return null;

                return (
                  <div key={field.id}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {field.label}
                      {field.isRequired && <span className="text-red-400 ml-1">*</span>}
                    </label>

                    {field.helpText && (
                      <p className="text-xs text-gray-400 mb-1.5">{field.helpText}</p>
                    )}

                    {field.type === "TEXT" && (
                      <input
                        type="text"
                        placeholder={field.placeholder ?? ""}
                        value={values[field.fieldKey] ?? ""}
                        onChange={(e) => setValue(field.fieldKey, e.target.value)}
                        className={inputClass}
                      />
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

                    {field.type === "DROPDOWN" && (
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

                    {field.type === "COLOR_PICKER" && (
                      <div className="flex flex-wrap gap-2">
                        {field.options.length > 0 ? field.options.map((o) => (
                          <button
                            key={o.id}
                            title={o.label}
                            onClick={() => setValue(field.fieldKey, o.value)}
                            style={{ background: o.value }}
                            className={`w-10 h-10 rounded-xl border-2 transition-transform hover:scale-110 ${
                              values[field.fieldKey] === o.value ? "border-orange-500 scale-110" : "border-gray-200"
                            }`}
                          />
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
                      <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {uploading[field.fieldKey] ? "Uploading..." : values[field.fieldKey] ? "Photo uploaded ✓" : "Upload your photo"}
                          </p>
                          <p className="text-xs text-gray-400">JPG, PNG supported</p>
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
