"use client";

import { useState, useEffect } from "react";
import { Upload } from "lucide-react";

export default function LogoUpload() {
  const [logo, setLogo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("store_logo");
    if (stored) setLogo(stored);
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok && data.url) {
      setLogo(data.url);
      localStorage.setItem("store_logo", data.url);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setUploading(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Store Logo</h2>
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden bg-gray-50">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="Logo" className="w-full h-full object-contain p-2" />
          ) : (
            <span className="text-3xl font-bold text-orange-500">SR</span>
          )}
        </div>
        <div>
          <label className="flex items-center gap-2 cursor-pointer bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload Logo"}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          {saved && <p className="text-green-600 text-xs mt-2">Logo saved!</p>}
          <p className="text-xs text-gray-400 mt-2">PNG/SVG recommended, transparent background</p>
        </div>
      </div>
    </div>
  );
}
