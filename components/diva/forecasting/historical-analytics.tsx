"use client";
import { useState } from "react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { getUserHistoricalData } from "@/actions/diva/forecasting";
import { fmtMoney } from "@/lib/diva/forecast-engine";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from "recharts";
import { Loader2 } from "lucide-react";

type RangeKey = "7d" | "30d" | "90d" | "1y" | "all";
type DataPoint = { date: string; balance: number; deposits: number; adjustments: number };

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "1y", label: "1Y" },
  { key: "all", label: "All" },
];

export function HistoricalAnalytics({ initial }: { initial: DataPoint[] }) {
  const [points, setPoints] = useState(initial);
  const [range, setRange] = useState<RangeKey>("30d");
  const [loading, setLoading] = useState(false);
  const [chart, setChart] = useState<"area" | "bar">("area");

  async function changeRange(r: RangeKey) {
    setRange(r);
    setLoading(true);
    const res = await getUserHistoricalData(r);
    if (!("error" in res)) setPoints(res.points as DataPoint[]);
    setLoading(false);
  }

  const maxBalance = Math.max(...points.map(p => p.balance), 0);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          {RANGES.map(r => (
            <button key={r.key} onClick={() => changeRange(r.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${range === r.key ? "bg-[#D4AF37] text-black" : "text-white/40 hover:text-white/70"}`}>
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          {(["area", "bar"] as const).map(c => (
            <button key={c} onClick={() => setChart(c)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize ${chart === c ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <GlassCard className="p-20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
        </GlassCard>
      ) : points.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <p className="text-white/30 text-sm">No historical data for this range yet.</p>
          <p className="text-white/20 text-xs mt-1">Make deposits to see your portfolio growth over time.</p>
        </GlassCard>
      ) : (
        <>
          {/* Balance chart */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/60">Portfolio Balance Over Time</h3>
              <span className="text-xs text-[#D4AF37] font-semibold">Peak: {fmtMoney(maxBalance)}</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              {chart === "area" ? (
                <AreaChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="histGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={v => fmtMoney(v)} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} width={65} />
                  <Tooltip
                    formatter={(v: any, n: any) => [fmtMoney(Number(v)), n]}
                    contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                    labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                  />
                  <Area type="monotone" dataKey="balance" name="Balance" stroke="#D4AF37" fill="url(#histGold)" strokeWidth={2} dot={false} />
                </AreaChart>
              ) : (
                <BarChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={v => fmtMoney(v)} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} width={65} />
                  <Tooltip
                    formatter={(v: any, n: any) => [fmtMoney(Number(v)), n]}
                    contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="balance" name="Balance" fill="#D4AF37" radius={[3, 3, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </GlassCard>

          {/* Deposit activity */}
          <GlassCard className="p-6">
            <h3 className="text-sm font-medium text-white/60 mb-4">Deposit Activity</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={v => fmtMoney(v)} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} width={65} />
                <Tooltip
                  formatter={(v: any, n: any) => [fmtMoney(Number(v)), n]}
                  contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }} />
                <Bar dataKey="deposits" name="Deposits" fill="#34d399" radius={[3, 3, 0, 0]} />
                <Bar dataKey="adjustments" name="Adjustments" fill="#818cf8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </>
      )}
    </div>
  );
}
