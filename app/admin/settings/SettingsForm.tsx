"use client";

import { useState } from "react";
import { Upload, Save } from "lucide-react";

export default function SettingsForm({ settings, razorpaySet }: { settings: Record<string, string>; razorpaySet: boolean }) {
  const [form, setForm] = useState({
    store_name: settings.store_name ?? "Shiv Radium",
    store_phone: settings.store_phone ?? "",
    store_email: settings.store_email ?? "",
    store_logo: settings.store_logo ?? "",
    shipping_free_above: settings.shipping_free_above ?? "999",
    shipping_charge: settings.shipping_charge ?? "99",
    gift_wrapping_enabled: settings.gift_wrapping_enabled ?? "true",
    gift_wrapping_charge: settings.gift_wrapping_charge ?? "49",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok && data.url) set("store_logo", data.url);
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Logo */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Store Logo</h2>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden bg-gray-50">
            {form.store_logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.store_logo} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <span className="text-2xl font-bold text-orange-500">SR</span>
            )}
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Upload Logo"}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
            </label>
            {form.store_logo && (
              <button onClick={() => set("store_logo", "")} className="text-xs text-red-400 mt-2 hover:text-red-600 block">Remove logo</button>
            )}
            <p className="text-xs text-gray-400 mt-2">PNG/SVG, transparent background recommended</p>
          </div>
        </div>
      </div>

      {/* Store Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Store Info</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Name</label>
            <input className={inputClass} value={form.store_name} onChange={(e) => set("store_name", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Phone</label>
            <input className={inputClass} placeholder="+91 98765 43210" value={form.store_phone} onChange={(e) => set("store_phone", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Email</label>
            <input className={inputClass} placeholder="orders@shivradium.com" value={form.store_email} onChange={(e) => set("store_email", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Shipping */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Shipping Charges</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Free Shipping Above (₹)</label>
            <input className={inputClass} type="number" value={form.shipping_free_above} onChange={(e) => set("shipping_free_above", e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">Orders above this amount get free shipping</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Standard Shipping Charge (₹)</label>
            <input className={inputClass} type="number" value={form.shipping_charge} onChange={(e) => set("shipping_charge", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Gift Wrapping */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Gift Wrapping</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Enable Gift Wrapping Option</p>
              <p className="text-xs text-gray-400">Customers can add gift wrapping at checkout</p>
            </div>
            <button
              onClick={() => set("gift_wrapping_enabled", form.gift_wrapping_enabled === "true" ? "false" : "true")}
              className={`w-12 h-6 rounded-full transition-colors ${form.gift_wrapping_enabled === "true" ? "bg-orange-500" : "bg-gray-200"}`}
            >
              <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.gift_wrapping_enabled === "true" ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>
          {form.gift_wrapping_enabled === "true" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gift Wrapping Charge (₹)</label>
              <input className={inputClass} type="number" value={form.gift_wrapping_charge} onChange={(e) => set("gift_wrapping_charge", e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* Payment */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Payment — Razorpay</h2>
        <p className="text-xs text-gray-400 mb-4">Keys Vercel environment variables mein set karo</p>
        <div className="flex justify-between py-2 text-sm">
          <span className="text-gray-500">RAZORPAY_KEY_ID</span>
          <span className={`font-medium text-xs ${razorpaySet ? "text-green-600" : "text-red-400"}`}>{razorpaySet ? "✓ Set" : "Not set"}</span>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-orange-100"
      >
        <Save className="w-4 h-4" />
        {saving ? "Saving..." : saved ? "Saved ✓" : "Save Settings"}
      </button>
    </div>
  );
}
