"use client";

import { useState, useEffect } from "react";
import { getWithdrawalAnalytics } from "@/actions/diva/analytics";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { DivaAreaChart } from "@/components/diva/charts/area-chart";
import { DivaPieChart } from "@/components/diva/charts/pie-chart";
import type { WithdrawalAnalyticsData, PeriodFilter } from "@/types/diva/analytics";

const PERIODS: { v: PeriodFilter; l: string }[] = [{ v: "7d", l: "7 Days" }, { v: "30d", l: "30 Days" }, { v: "90d", l: "90 Days" }];

export default function WithdrawalAnalyticsPage() {
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [data, setData] = useState<WithdrawalAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getWithdrawalAnalytics(period).then((r) => { setData(r.data ?? null); setLoading(false); });
  }, [period]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Withdrawal Analytics</h1>
          <p className="text-sm text-white/40 mt-1">Withdrawal volume, approval rate and status breakdown</p>
        </div>
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
          {PERIODS.map((p) => (
            <button key={p.v} onClick={() => setPeriod(p.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p.v ? "bg-[#D4AF37] text-black" : "text-white/40 hover:text-white/70"}`}>
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total Volume", value: `$${(data?.totalVolume ?? 0).toLocaleString()}`, color: "text-orange-400" },
              { label: "Total Count", value: data?.totalCount ?? 0, color: "text-white" },
              { label: "Approval Rate", value: `${data?.approvalRate ?? 0}%`, color: "text-emerald-400" },
              { label: "Pending", value: data?.pendingCount ?? 0, color: "text-yellow-400" },
            ].map((s) => (
              <GlassCard key={s.label} className="p-5">
                <p className="text-xs text-white/40 mb-2">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
              </GlassCard>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <p className="text-sm font-semibold text-white mb-5">Volume Trend</p>
              <DivaAreaChart data={data?.volumeSeries ?? []} color="#f97316" valuePrefix="$" height={220} />
            </GlassCard>
            <GlassCard className="p-6">
              <p className="text-sm font-semibold text-white mb-5">Status Breakdown</p>
              {(data?.statusBreakdown?.length ?? 0) > 0
                ? <DivaPieChart data={data?.statusBreakdown ?? []} height={240} />
                : <p className="text-center text-white/30 text-sm py-16">No data yet</p>}
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
