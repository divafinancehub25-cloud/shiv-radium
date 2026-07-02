"use client";

import { useState } from "react";
import { adminRecordKpiValues } from "@/actions/diva/kpi";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export function RecordKpiBtn() {
  const [loading, setLoading] = useState(false);

  const handleRecord = async () => {
    setLoading(true);
    const res = await adminRecordKpiValues();
    if (res.success) { toast.success("KPI values recorded!"); window.location.reload(); }
    else toast.error(res.error ?? "Failed");
    setLoading(false);
  };

  return (
    <button
      onClick={handleRecord}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-sm font-medium hover:bg-[#D4AF37]/25 transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Recording..." : "Record Values"}
    </button>
  );
}
