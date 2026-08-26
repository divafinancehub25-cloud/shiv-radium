"use client";
import { useForecastingStore } from "@/lib/diva/store/forecasting-store";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { fmtMoney, fmtPct } from "@/lib/diva/forecast-engine";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { TrendingUp, DollarSign, Clock, Percent, BarChart3 } from "lucide-react";
import type { CompoundingFreq, ContribFreq } from "@/types/diva/forecasting";

const SLIDER_CLASS = "w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-[#D4AF37]";

export function FVCalculator() {
  const { calcInput, calcResult, setCalcInput } = useForecastingStore();

  if (!calcResult) return null;
  const { projectedValue, totalContributions, estimatedGrowth, principal, dataPoints, cagr } = calcResult;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Controls ── */}
        <GlassCard className="p-6 space-y-5">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Forecast Parameters</h2>

          {/* Investment Amount — type any value */}
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Investment Amount ($)</label>
            <input
              type="number"
              min={0}
              value={calcInput.initialAmount}
              onChange={e => setCalcInput({ initialAmount: Number(e.target.value) || 0, contributionAmount: 0 })}
              placeholder="300"
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-lg font-semibold focus:outline-none focus:border-[#D4AF37]/40"
            />
            <p className="text-[10px] text-white/25 mt-1">Jitne dollar invest karna hai wo type karo (jaise 300)</p>
          </div>

          {/* Duration */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs text-white/40">Time Period</label>
              <span className="text-sm font-mono text-[#D4AF37]">{calcInput.durationYears} years</span>
            </div>
            <input type="range" min={1} max={40} step={1} value={calcInput.durationYears}
              onChange={e => setCalcInput({ durationYears: Number(e.target.value) })} className={SLIDER_CLASS} />
            <div className="flex justify-between text-[10px] text-white/20 mt-0.5">
              <span>1 yr</span><span>40 yrs</span>
            </div>
          </div>

          {/* Growth Rate — MONTHLY (STICKO gives 15% compounded monthly) */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs text-white/40">Monthly Growth Rate</label>
              <span className="text-sm font-mono text-[#D4AF37]">{fmtPct(calcInput.growthRate / 12)} / mo</span>
            </div>
            <input type="range" min={0} max={30} step={0.5} value={calcInput.growthRate / 12}
              onChange={e => setCalcInput({ growthRate: Number(e.target.value) * 12, compoundingFreq: "MONTHLY" })} className={SLIDER_CLASS} />
            <div className="flex justify-between text-[10px] text-white/20 mt-0.5">
              <span>0%/mo</span><span>30%/mo</span>
            </div>
          </div>

          {/* Monthly compound note */}
          <p className="text-[11px] text-white/30 border-t border-white/[0.06] pt-3">
            💡 15% har mahine, compound (byaaj pe byaaj). Sirf invest amount grow hota hai.
          </p>
        </GlassCard>

        {/* ── Results ── */}
        <div className="space-y-4">
          <GlassCard className="p-6 border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/[0.05] to-transparent">
            <p className="text-xs text-white/40 mb-1">{calcInput.durationYears} saal baad milega</p>
            <p className="text-4xl font-bold text-white tracking-tight">{fmtMoney(projectedValue)}</p>
            <p className="text-xs text-[#D4AF37] mt-1">{fmtMoney(principal)} se ~{(projectedValue / Math.max(principal, 1)).toFixed(0)}x</p>
          </GlassCard>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Invested", value: fmtMoney(principal), icon: DollarSign, color: "text-white/70" },
              { label: "Profit", value: fmtMoney(estimatedGrowth), icon: BarChart3, color: "text-[#D4AF37]" },
            ].map(({ label, value, icon: Icon, color }) => (
              <GlassCard key={label} className="p-4">
                <Icon className={`w-4 h-4 ${color} mb-2`} />
                <p className="text-xs text-white/30">{label}</p>
                <p className={`text-sm font-semibold ${color}`}>{value}</p>
              </GlassCard>
            ))}
          </div>

          {/* Invested vs Profit bar */}
          <GlassCard className="p-4">
            <p className="text-xs text-white/40 mb-2">Invested vs Profit</p>
            <div className="flex rounded-full overflow-hidden h-3">
              <div style={{ width: `${(principal / Math.max(projectedValue, 1)) * 100}%` }} className="bg-white/30" />
              <div style={{ width: `${(estimatedGrowth / Math.max(projectedValue, 1)) * 100}%` }} className="bg-gradient-to-r from-[#D4AF37] to-[#F5D76E]" />
            </div>
            <div className="flex justify-between text-[10px] text-white/30 mt-1.5">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/30" />Invested</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D4AF37]" />Profit</span>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ── Chart ── */}
      <GlassCard className="p-6">
        <h3 className="text-sm font-medium text-white/60 mb-4">Portfolio Projection Curve</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={dataPoints} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="calcGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="calcBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={v => fmtMoney(v)} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} width={60} />
            <Tooltip
              formatter={(v: any, name: any) => [fmtMoney(Number(v)), name]}
              contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
              labelStyle={{ color: "rgba(255,255,255,0.6)" }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }} />
            <Area type="monotone" dataKey="balance" name="Portfolio Value" stroke="#D4AF37" fill="url(#calcGold)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="contributions" name="Contributions" stroke="#60a5fa" fill="url(#calcBlue)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
}
