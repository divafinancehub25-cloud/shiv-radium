"use client";
import { useState } from "react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { calcForecastMonthly, fmtMoney, fmtPct } from "@/lib/diva/forecast-engine";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import type { CompoundingFreq } from "@/types/diva/forecasting";

type Period = "1y" | "3y" | "5y" | "10y" | "custom";

const PERIOD_LABELS: Record<Period, string> = { "1y": "1 Year", "3y": "3 Years", "5y": "5 Years", "10y": "10 Years", custom: "Custom" };
const PERIOD_YEARS: Partial<Record<Period, number>> = { "1y": 1, "3y": 3, "5y": 5, "10y": 10 };

type Props = { currentBalance: number };

export function ForecastDashboard({ currentBalance }: Props) {
  const [period, setPeriod] = useState<Period>("5y");
  const [customYears, setCustomYears] = useState(7);
  const [rate, setRate] = useState(8);
  const [monthly, setMonthly] = useState(500);
  const [freq, setFreq] = useState<CompoundingFreq>("MONTHLY");

  const years = period === "custom" ? customYears : (PERIOD_YEARS[period] ?? 5);

  const points = calcForecastMonthly({
    initialAmount: currentBalance,
    contributionAmount: monthly,
    contributionFreq: "MONTHLY",
    durationYears: years,
    growthRate: rate,
    compoundingFreq: freq,
  });

  // Downsample to yearly for readability
  const yearly = points.filter((_, i) => i % 12 === 0 || i === points.length - 1);
  const final = yearly[yearly.length - 1];
  const growth = final ? final.balance - currentBalance - final.contributions : 0;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-2">
        {(["1y", "3y", "5y", "10y", "custom"] as Period[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${period === p ? "bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-black" : "bg-white/[0.05] text-white/40 hover:text-white/70"}`}>
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/40">Years:</span>
          <input type="range" min={1} max={40} value={customYears} onChange={e => setCustomYears(Number(e.target.value))}
            className="w-48 h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-[#D4AF37]" />
          <span className="text-sm font-mono text-[#D4AF37]">{customYears}y</span>
        </div>
      )}

      {/* Result cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5 border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/[0.04] to-transparent">
          <p className="text-xs text-white/40 mb-1">Projected in {years} Year{years !== 1 ? "s" : ""}</p>
          <p className="text-3xl font-bold text-white">{final ? fmtMoney(final.balance) : "—"}</p>
          <p className="text-xs text-[#D4AF37] mt-1">Starting from {fmtMoney(currentBalance)}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs text-white/40 mb-1">Estimated Growth</p>
          <p className="text-2xl font-bold text-emerald-400">{fmtMoney(Math.max(0, growth))}</p>
          <p className="text-xs text-white/30 mt-1">From compounding at {fmtPct(rate)}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs text-white/40 mb-1">Total Contributions</p>
          <p className="text-2xl font-bold text-blue-400">{final ? fmtMoney(final.contributions) : "—"}</p>
          <p className="text-xs text-white/30 mt-1">{fmtMoney(monthly)}/mo over {years} years</p>
        </GlassCard>
      </div>

      {/* Settings row */}
      <GlassCard className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs text-white/40">Monthly Contribution</label>
              <span className="text-xs font-mono text-[#D4AF37]">{fmtMoney(monthly)}</span>
            </div>
            <input type="range" min={0} max={10000} step={100} value={monthly}
              onChange={e => setMonthly(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-[#D4AF37]" />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs text-white/40">Annual Growth Rate</label>
              <span className="text-xs font-mono text-[#D4AF37]">{fmtPct(rate)}</span>
            </div>
            <input type="range" min={0} max={25} step={0.5} value={rate}
              onChange={e => setRate(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-[#D4AF37]" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Compounding</label>
            <select value={freq} onChange={e => setFreq(e.target.value as CompoundingFreq)}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-xs focus:outline-none">
              <option value="DAILY">Daily</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUALLY">Annually</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Main chart */}
      <GlassCard className="p-6">
        <h3 className="text-sm font-medium text-white/60 mb-4">Portfolio Trajectory — {years}-Year View</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={yearly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="dashGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="dashBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={v => fmtMoney(v)} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} width={65} />
            <Tooltip
              formatter={(v: any, n: any) => [fmtMoney(Number(v)), n]}
              contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
              labelStyle={{ color: "rgba(255,255,255,0.6)" }}
            />
            {currentBalance > 0 && <ReferenceLine y={currentBalance} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" label={{ value: "Current", fill: "rgba(255,255,255,0.2)", fontSize: 9 }} />}
            <Area type="monotone" dataKey="balance" name="Portfolio Value" stroke="#D4AF37" fill="url(#dashGold)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="contributions" name="Contributions" stroke="#60a5fa" fill="url(#dashBlue)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
}
