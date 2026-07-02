"use client";

import { useState, useEffect } from "react";
import { getAlerts, autoDetectAlerts } from "@/actions/diva/alerts";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { AlertRow } from "@/components/diva/admin/alert-row";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const FILTERS = ["ALL", "OPEN", "ACKNOWLEDGED", "RESOLVED"] as const;
type Filter = typeof FILTERS[number];

export default function AlertsPage() {
  const [filter, setFilter] = useState<Filter>("OPEN");
  const [data, setData] = useState<any>({ data: [], openCount: 0, criticalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = () => {
    setLoading(true);
    getAlerts(filter === "ALL" ? undefined : filter as any).then((r) => {
      setData(r); setLoading(false);
    });
  };

  useEffect(() => { load(); }, [filter]);

  const runDetection = async () => {
    setRunning(true);
    const res = await autoDetectAlerts();
    if (res.success) { toast.success("Alert detection complete"); load(); }
    else toast.error(res.error ?? "Failed");
    setRunning(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">System Alerts</h1>
          <p className="text-sm text-white/40 mt-1">
            {data.openCount} open · {data.criticalCount} critical
          </p>
        </div>
        <button
          onClick={runDetection}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-sm font-medium hover:bg-[#D4AF37]/25 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${running ? "animate-spin" : ""}`} />
          Run Detection
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Open", value: data.openCount ?? 0, color: "text-yellow-400" },
          { label: "Critical", value: data.criticalCount ?? 0, color: "text-red-400" },
          { label: "Total", value: data.total ?? 0, color: "text-white" },
        ].map((s) => (
          <GlassCard key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 w-fit">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? "bg-[#D4AF37] text-black" : "text-white/40 hover:text-white/70"}`}>
            {f}
          </button>
        ))}
      </div>

      <GlassCard className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
          </div>
        ) : (data.data?.length ?? 0) === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No {filter.toLowerCase()} alerts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.data?.map((a: any) => <AlertRow key={a.id} alert={a} onAction={load} />)}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
