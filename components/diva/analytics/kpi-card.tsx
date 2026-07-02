"use client";

import { GlassCard } from "@/components/diva/ui/glass-card";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, XCircle } from "lucide-react";
import type { KpiCard } from "@/types/diva/analytics";

export function KpiCardWidget({ kpi }: { kpi: KpiCard }) {
  const statusColors = {
    normal: "border-white/[0.06]",
    warning: "border-yellow-500/30",
    critical: "border-red-500/40",
  };

  const statusBadge = {
    normal: null,
    warning: <span className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full"><AlertTriangle className="w-2.5 h-2.5" />Warning</span>,
    critical: <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full"><XCircle className="w-2.5 h-2.5" />Critical</span>,
  };

  const TrendIcon = kpi.trend > 0 ? TrendingUp : kpi.trend < 0 ? TrendingDown : Minus;
  const trendColor = kpi.trend > 0 ? "text-emerald-400" : kpi.trend < 0 ? "text-red-400" : "text-white/30";

  const progress = kpi.target ? Math.min((kpi.currentValue / kpi.target) * 100, 100) : null;

  return (
    <GlassCard className={`p-5 border ${statusColors[kpi.status]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/40 truncate">{kpi.name}</p>
          {kpi.description && <p className="text-[10px] text-white/20 truncate mt-0.5">{kpi.description}</p>}
        </div>
        {statusBadge[kpi.status]}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-white">
            {kpi.currentValue.toLocaleString()}
            <span className="text-sm text-white/30 ml-1">{kpi.unit}</span>
          </p>
          {kpi.target != null && (
            <p className="text-xs text-white/30 mt-0.5">Target: {kpi.target.toLocaleString()}</p>
          )}
        </div>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{kpi.trend > 0 ? "+" : ""}{kpi.trend}%</span>
        </div>
      </div>

      {progress != null && (
        <div className="mt-3">
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: kpi.status === "critical" ? "#ef4444" : kpi.status === "warning" ? "#eab308" : "#D4AF37",
              }}
            />
          </div>
          <p className="text-[10px] text-white/20 mt-1">{Math.round(progress)}% of target</p>
        </div>
      )}
    </GlassCard>
  );
}
