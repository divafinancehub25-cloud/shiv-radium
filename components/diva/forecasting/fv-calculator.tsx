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

          {/* Initial Amount */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs text-white/40">Initial Amount</label>
              <span className="text-sm font-mono text-[#D4AF37]">{fmtMoney(calcInput.initialAmount)}</span>
            </div>
            <input type="range" min={0} max={500000} step={1000} value={calcInput.initialAmount}
              onChange={e => setCalcInput({ initialAmount: Number(e.target.value) })} className={SLIDER_CLASS} />
            <div className="flex justify-between text-[10px] text-white/20 mt-0.5">
              <span>$0</span><span>$500K</span>
            </div>
          </div>

          {/* Monthly Contribution */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs text-white/40">Monthly Contribution</label>
              <span className="text-sm font-mono text-[#D4AF37]">{fmtMoney(calcInput.contributionAmount)}/mo</span>
            </div>
            <input type="range" min={0} max={10000} step={100} value={calcInput.contributionAmount}
              onChange={e => setCalcInput({ contributionAmount: Number(e.target.value) })} className={SLIDER_CLASS} />
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

          {/* Growth Rate */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs text-white/40">Annual Growth Rate</label>
              <span className="text-sm font-mono text-[#D4AF37]">{fmtPct(calcInput.growthRate)}</span>
            </div>
            <input type="range" min={0} max={30} step={0.5} value={calcInput.growthRate}
              onChange={e => setCalcInput({ growthRate: Number(e.target.value) })} className={SLIDER_CLASS} />
            <div className="flex justify-between text-[10px] text-white/20 mt-0.5">
              <span>0%</span><span>30%</span>
            </div>
          </div>

          {/* Compounding & Contribution Freq */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Compounding</label>
              <select value={calcInput.compoundingFreq}
                onChange={e => setCalcInput({ compoundingFreq: e.target.value as CompoundingFreq })}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#D4AF37]/40">
                <option value="DAILY">Daily</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="ANNUALLY">Annually</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Contribution</label>
              <select value={calcInput.contributionFreq}
                onChange={e => setCalcInput({ contributionFreq: e.target.value as ContribFreq })}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#D4AF37]/40">
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="ANNUALLY">Annually</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* ── Results ── */}
        <div className="space-y-4">
          <GlassCard className="p-6 border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/[0.05] to-transparent">
            <p className="text-xs text-white/40 mb-1">Projected Value</p>
            <p className="text-4xl font-bold text-white tracking-tight">{fmtMoney(projectedValue)}</p>
            <p className="text-xs text-[#D4AF37] mt-1">CAGR: {fmtPct(cagr)}</p>
          </GlassCard>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Principal", value: fmtMoney(principal), icon: DollarSign, color: "text-white/70" },
              { label: "Contributions", value: fmtMoney(totalContributions), icon: TrendingUp, color: "text-blue-400" },
              { label: "Est. Growth", value: fmtMoney(estimatedGrowth), icon: BarChart3, color: "text-[#D4AF37]" },
            ].map(({ label, value, icon: Icon, color }) => (
              <GlassCard key={label} className="p-4">
                <Icon className={`w-4 h-4 ${color} mb-2`} />
                <p className="text-xs text-white/30">{label}</p>
                <p className={`text-sm font-semibold ${color}`}>{value}</p>
              </GlassCard>
            ))}
          </div>

          {/* Growth breakdown bar */}
          <GlassCard className="p-4">
            <p className="text-xs text-white/40 mb-2">Portfolio Breakdown at Year {calcInput.durationYears}</p>
            <div className="flex rounded-full overflow-hidden h-3">
              <div style={{ width: `${(principal / projectedValue) * 100}%` }} className="bg-white/30" />
              <div style={{ width: `${(totalContributions / projectedValue) * 100}%` }} className="bg-blue-400" />
              <div style={{ width: `${(estimatedGrowth / projectedValue) * 100}%` }} className="bg-gradient-to-r from-[#D4AF37] to-[#F5D76E]" />
            </div>
            <div className="flex justify-between text-[10px] text-white/30 mt-1.5">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/30" />Principal</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />Contribs</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D4AF37]" />Growth</span>
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
