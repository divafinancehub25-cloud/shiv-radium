"use client";

import { useState, useEffect } from "react";
import { getDepositAnalytics } from "@/actions/diva/analytics";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { DivaAreaChart } from "@/components/diva/charts/area-chart";
import { DivaBarChart } from "@/components/diva/charts/bar-chart";
import { DivaPieChart } from "@/components/diva/charts/pie-chart";
import type { DepositAnalyticsData, PeriodFilter } from "@/types/diva/analytics";

const PERIODS: { v: PeriodFilter; l: string }[] = [{ v: "7d", l: "7 Days" }, { v: "30d", l: "30 Days" }, { v: "90d", l: "90 Days" }];

export default function DepositAnalyticsPage() {
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [data, setData] = useState<DepositAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDepositAnalytics(period).then((r) => { setData(r.data ?? null); setLoading(false); });
  }, [period]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Deposit Analytics</h1>
          <p className="text-sm text-white/40 mt-1">Deposit volume, count and network breakdown</p>
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
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Volume", value: `$${(data?.totalVolume ?? 0).toLocaleString()}` },
              { label: "Total Count", value: data?.totalCount ?? 0 },
              { label: "Avg Deposit", value: `$${(data?.avgSize ?? 0).toFixed(2)}` },
            ].map((s) => (
              <GlassCard key={s.label} className="p-5">
                <p className="text-xs text-white/40 mb-2">{s.label}</p>
                <p className="text-2xl font-bold text-[#D4AF37]">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
              </GlassCard>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <p className="text-sm font-semibold text-white mb-5">Volume Trend</p>
              <DivaAreaChart data={data?.volumeSeries ?? []} color="#D4AF37" valuePrefix="$" height={220} />
            </GlassCard>
            <GlassCard className="p-6">
              <p className="text-sm font-semibold text-white mb-5">Deposit Count</p>
              <DivaBarChart data={data?.countSeries ?? []} color="#22c55e" height={220} />
            </GlassCard>
          </div>

          {(data?.networkBreakdown?.length ?? 0) > 0 && (
            <GlassCard className="p-6">
              <p className="text-sm font-semibold text-white mb-5">Network Distribution</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <DivaPieChart data={data?.networkBreakdown?.map((n) => ({ name: n.name, value: n.value })) ?? []} height={240} />
                <div className="space-y-3">
                  {data?.networkBreakdown?.map((n, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <p className="text-sm text-white">{n.name}</p>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#D4AF37]">{n.value} deposits</p>
                        <p className="text-xs text-white/30">${n.volume.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}
