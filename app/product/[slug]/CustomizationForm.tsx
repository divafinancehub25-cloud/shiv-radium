"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Upload } from "lucide-react";
import type { FieldType } from "@prisma/client";

type Option = { id: string; label: string; value: string; price: number | null };
type Field = {
  id: string;
  label: string;
  fieldKey: string;
  type: FieldType;
  placeholder: string | null;
  helpText: string | null;
  isRequired: boolean;
  options: Option[];
};
type Product = {
  id: string;
  name: string;
  slug: string;
  basePrice: number | { toNumber(): number };
  fields: Field[];
};

export default function CustomizationForm({ product }: { product: Product }) {
  const router = useRouter();
  const basePrice = typeof product.basePrice === "number"
    ? product.basePrice
    : (product.basePrice as { toNumber(): number }).toNumber();

  const [values, setValues] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate extra price from selected options
  const extraPrice = product.fields.reduce((acc, field) => {
    const selectedValue = values[field.fieldKey];
    if (!selectedValue) return acc;
    const option = field.options.find((o) => o.value === selectedValue);
    return acc + (option?.price ? Number(option.price) : 0);
  }, 0);

  const totalPrice = (basePrice + extraPrice) * quantity;

  function setValue(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function handleFileUpload(key: string, file: File) {
    setUploading((prev) => ({ ...prev, [key]: true }));
    // TODO: upload to Cloudinary — store URL in values
    const fakeUrl = URL.createObjectURL(file);
    setValue(key, fakeUrl);
    setUploading((prev) => ({ ...prev, [key]: false }));
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    for (const field of product.fields) {
      if (field.type === "QUANTITY") continue; // quantity managed separately
      if (field.isRequired && !values[field.fieldKey]) {
        newErrors[field.fieldKey] = `${field.label} is required`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function addToCart() {
    if (!validate()) return;

    const existing = JSON.parse(localStorage.getItem("cart") ?? "[]");
    const item = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      quantity,
      unitPrice: basePrice + extraPrice,
      totalPrice,
      customizationData: values,
    };
    localStorage.setItem("cart", JSON.stringify([...existing, item]));
    router.push("/cart");
  }

  return (
    <div className="space-y-5">
      {product.fields.map((field) => (
        <div key={field.id}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {field.label}
            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>

          {/* TEXT */}
          {field.type === "TEXT" && (
            <input
              type="text"
              placeholder={field.placeholder ?? ""}
              value={values[field.fieldKey] ?? ""}
              onChange={(e) => setValue(field.fieldKey, e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          )}

          {/* TEXTAREA */}
          {field.type === "TEXTAREA" && (
            <textarea
              rows={3}
              placeholder={field.placeholder ?? ""}
              value={values[field.fieldKey] ?? ""}
              onChange={(e) => setValue(field.fieldKey, e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
            />
          )}

          {/* DROPDOWN */}
          {field.type === "DROPDOWN" && (
            <select
              value={values[field.fieldKey] ?? ""}
              onChange={(e) => setValue(field.fieldKey, e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
            >
              <option value="">Select {field.label}</option>
              {field.options.map((opt) => (
                <option key={opt.id} value={opt.value}>
                  {opt.label}{opt.price ? ` (+₹${Number(opt.price)})` : ""}
                </option>
              ))}
            </select>
          )}

          {/* RADIO */}
          {field.type === "RADIO" && (
            <div className="flex flex-wrap gap-2">
              {field.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setValue(field.fieldKey, opt.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                    values[field.fieldKey] === opt.value
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 text-gray-600 hover:border-orange-300"
                  }`}
                >
                  {opt.label}
                  {opt.price ? <span className="ml-1 text-xs text-orange-500">+₹{Number(opt.price)}</span> : null}
                </button>
              ))}
            </div>
          )}

          {/* DATE */}
          {field.type === "DATE" && (
            <input
              type="date"
              value={values[field.fieldKey] ?? ""}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setValue(field.fieldKey, e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          )}

          {/* COLOR_PICKER */}
          {field.type === "COLOR_PICKER" && (
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={values[field.fieldKey] ?? "#000000"}
                onChange={(e) => setValue(field.fieldKey, e.target.value)}
                className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
              />
              <span className="text-sm text-gray-500">{values[field.fieldKey] ?? "Pick a color"}</span>
            </div>
          )}

          {/* QUANTITY */}
          {field.type === "QUANTITY" && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-lg font-medium hover:bg-gray-50"
              >
                −
              </button>
              <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-lg font-medium hover:bg-gray-50"
              >
                +
              </button>
            </div>
          )}

          {/* IMAGE_UPLOAD / FILE_UPLOAD */}
          {(field.type === "IMAGE_UPLOAD" || field.type === "FILE_UPLOAD") && (
            <div>
              {values[field.fieldKey] ? (
                <div className="flex items-center gap-3 p-3 border border-green-200 bg-green-50 rounded-xl">
                  {field.type === "IMAGE_UPLOAD" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={values[field.fieldKey]} alt="uploaded" className="w-12 h-12 object-cover rounded-lg" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-green-700 font-medium">File uploaded ✓</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValue(field.fieldKey, "")}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all">
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {uploading[field.fieldKey] ? "Uploading..." : "Click to upload photo"}
                  </span>
                  <span className="text-xs text-gray-400">JPG, PNG up to 10MB</span>
                  <input
                    type="file"
                    accept={field.type === "IMAGE_UPLOAD" ? "image/*" : "*"}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(field.fieldKey, file);
                    }}
                  />
                </label>
              )}
            </div>
          )}

          {errors[field.fieldKey] && (
            <p className="text-red-500 text-xs mt-1">{errors[field.fieldKey]}</p>
          )}
          {field.helpText && (
            <p className="text-gray-400 text-xs mt-1">{field.helpText}</p>
          )}
        </div>
      ))}

      {/* Price Summary */}
      <div className="border-t border-gray-100 pt-5 space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Base price</span>
          <span>₹{basePrice}</span>
        </div>
        {extraPrice > 0 && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>Customization charges</span>
            <span>+₹{extraPrice}</span>
          </div>
        )}
        {quantity > 1 && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>Quantity</span>
            <span>× {quantity}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-100">
          <span>Total</span>
          <span>₹{totalPrice}</span>
        </div>
      </div>

      <button
        onClick={addToCart}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-200"
      >
        <ShoppingCart className="w-5 h-5" />
        Add to Cart
      </button>
    </div>
  );
}
