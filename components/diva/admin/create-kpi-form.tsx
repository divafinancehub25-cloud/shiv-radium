"use client";

import { useState } from "react";
import { adminCreateKpi } from "@/actions/diva/kpi";
import { toast } from "sonner";

export function CreateKpiForm() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", formula: "", unit: "", target: "" });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50 transition-colors placeholder:text-white/20";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.formula) return toast.error("Name and formula are required");
    setLoading(true);
    const res = await adminCreateKpi({ ...form, target: form.target ? parseFloat(form.target) : undefined });
    if (res.success) { toast.success("KPI created!"); setForm({ name: "", description: "", formula: "", unit: "", target: "" }); window.location.reload(); }
    else toast.error(res.error ?? "Failed");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-white/40 block mb-1.5">KPI Name *</label>
        <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. DAU" className={inputCls} />
      </div>
      <div>
        <label className="text-xs text-white/40 block mb-1.5">Description</label>
        <input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What this metric measures" className={inputCls} />
      </div>
      <div>
        <label className="text-xs text-white/40 block mb-1.5">Formula / Query Key *</label>
        <input value={form.formula} onChange={(e) => set("formula", e.target.value)} placeholder="e.g. COUNT(active_users_today)" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/40 block mb-1.5">Unit</label>
          <input value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="%, users, $" className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-1.5">Target</label>
          <input type="number" step="any" value={form.target} onChange={(e) => set("target", e.target.value)} placeholder="80" className={inputCls} />
        </div>
      </div>
      <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-50 mt-2">
        {loading ? "Creating..." : "Create KPI"}
      </button>
    </form>
  );
}
