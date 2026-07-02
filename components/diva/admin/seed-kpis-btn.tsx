"use client";

import { useState } from "react";
import { adminSeedDefaultKpis } from "@/actions/diva/kpi";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export function SeedKpisBtn() {
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    const res = await adminSeedDefaultKpis();
    if (res.success) { toast.success("Default KPIs seeded!"); window.location.reload(); }
    else toast.error(res.error ?? "Failed");
    setLoading(false);
  };

  return (
    <button
      onClick={handleSeed}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/60 text-sm hover:bg-white/[0.06] transition-colors disabled:opacity-50"
    >
      <Sparkles className="w-4 h-4" />
      {loading ? "Seeding..." : "Seed Defaults"}
    </button>
  );
}
