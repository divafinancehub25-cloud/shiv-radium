"use client";

import { useState, useEffect } from "react";
import { getUserAnalytics } from "@/actions/diva/analytics";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { DivaAreaChart } from "@/components/diva/charts/area-chart";
import { Users, TrendingUp, UserCheck } from "lucide-react";
import type { UserGrowthData, PeriodFilter } from "@/types/diva/analytics";

const PERIODS: { v: PeriodFilter; l: string }[] = [{ v: "7d", l: "7 Days" }, { v: "30d", l: "30 Days" }, { v: "90d", l: "90 Days" }, { v: "1y", l: "1 Year" }];

export default function UserAnalyticsPage() {
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [data, setData] = useState<UserGrowthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getUserAnalytics(period).then((r) => { setData(r.data ?? null); setLoading(false); });
  }, [period]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">User Analytics</h1>
          <p className="text-sm text-white/40 mt-1">User growth and registration trends</p>
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
              { label: "Total Users", value: data?.totalUsers ?? 0, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
              { label: `New (${period})`, value: data?.newThisPeriod ?? 0, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10" },
              { label: "Growth Rate", value: `${data?.growthRate ?? 0}%`, icon: UserCheck, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
            ].map((s) => (
              <GlassCard key={s.label} className="p-5">
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-white">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
                <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
              </GlassCard>
            ))}
          </div>

          <GlassCard className="p-6">
            <p className="text-sm font-semibold text-white mb-5">New Registrations Over Time</p>
            <DivaAreaChart data={data?.series ?? []} color="#6366f1" label="users" height={280} />
          </GlassCard>
        </>
      )}
    </div>
  );
}
