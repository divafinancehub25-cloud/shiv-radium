"use client";

import { useState, useEffect } from "react";
import { getReferralAnalytics } from "@/actions/diva/analytics";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { DivaAreaChart } from "@/components/diva/charts/area-chart";
import type { ReferralAnalyticsData, PeriodFilter } from "@/types/diva/analytics";

const PERIODS: { v: PeriodFilter; l: string }[] = [{ v: "7d", l: "7 Days" }, { v: "30d", l: "30 Days" }, { v: "90d", l: "90 Days" }];

export default function ReferralAnalyticsPage() {
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [data, setData] = useState<ReferralAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getReferralAnalytics(period).then((r) => { setData(r.data ?? null); setLoading(false); });
  }, [period]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Referral Analytics</h1>
          <p className="text-sm text-white/40 mt-1">Referral funnel, conversion and top referrers</p>
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Conversion Rate", value: `${data?.conversionRate ?? 0}%`, color: "text-[#D4AF37]" },
              { label: "Total Rewards (pts)", value: data?.totalRewards ?? 0, color: "text-emerald-400" },
            ].map((s) => (
              <GlassCard key={s.label} className="p-5">
                <p className="text-xs text-white/40 mb-2">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
              </GlassCard>
            ))}
          </div>

          <GlassCard className="p-6">
            <p className="text-sm font-semibold text-white mb-5">Referral Growth</p>
            <DivaAreaChart data={data?.series ?? []} color="#ec4899" height={220} />
          </GlassCard>

          {/* Funnel */}
          <GlassCard className="p-6">
            <p className="text-sm font-semibold text-white mb-5">Conversion Funnel</p>
            <div className="space-y-3">
              {(data?.funnel ?? []).map((f, i) => (
                <div key={f.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-white/60">{f.stage}</p>
                    <p className="text-xs text-white font-semibold">{f.count} ({f.pct}%)</p>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#ec4899] transition-all" style={{ width: `${f.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Top Referrers */}
          {(data?.topReferrers?.length ?? 0) > 0 && (
            <GlassCard className="p-6">
              <p className="text-sm font-semibold text-white mb-5">Top Referrers</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left pb-2 text-xs text-white/30 font-medium">#</th>
                    <th className="text-left pb-2 text-xs text-white/30 font-medium">Member</th>
                    <th className="text-right pb-2 text-xs text-white/30 font-medium">Referrals</th>
                    <th className="text-right pb-2 text-xs text-white/30 font-medium">Activated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {data?.topReferrers?.map((r, i) => (
                    <tr key={i}>
                      <td className="py-2.5 pr-3 text-white/30 text-xs">#{i + 1}</td>
                      <td className="py-2.5 pr-4">
                        <p className="text-white text-xs font-medium">{r.name}</p>
                        <p className="text-white/30 text-[10px]">{r.email}</p>
                      </td>
                      <td className="py-2.5 text-right text-[#D4AF37] font-semibold text-sm">{r.count}</td>
                      <td className="py-2.5 text-right text-emerald-400 text-sm">{r.activated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}
