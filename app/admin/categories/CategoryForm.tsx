"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
};

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function CategoryForm({ category }: { category?: Category }) {
  const router = useRouter();
  const isEdit = !!category;

  const [form, setForm] = useState({
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    icon: category?.icon ?? "",
    sortOrder: category?.sortOrder?.toString() ?? "0",
    isActive: category?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.name) { setError("Name zaroori hai"); return; }
    setLoading(true);
    setError("");
    try {
      const url = isEdit ? `/api/admin/categories/${category!.id}` : "/api/admin/categories";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push("/admin/categories");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? "Edit Category" : "New Category"}</h1>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category Name *</label>
            <input
              className={inputClass}
              placeholder="e.g. Name Plates"
              value={form.name}
              onChange={(e) => { set("name", e.target.value); if (!isEdit) set("slug", slugify(e.target.value)); }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Icon (Emoji)</label>
            <input
              className={inputClass}
              placeholder="🪧"
              value={form.icon}
              onChange={(e) => set("icon", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Slug *</label>
            <input
              className={inputClass}
              placeholder="name-plates"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort Order</label>
            <input
              className={inputClass}
              type="number"
              placeholder="0"
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              className={inputClass + " resize-none"}
              rows={3}
              placeholder="Category description..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="w-4 h-4 accent-orange-500" />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button onClick={() => router.back()} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold rounded-xl shadow-lg shadow-orange-100">
            {loading ? "Saving..." : isEdit ? "Update" : "Create Category"}
          </button>
        </div>
      </div>
    </div>
  );
}
