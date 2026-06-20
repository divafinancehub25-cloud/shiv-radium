"use client";
import { useState } from "react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { calcForecast, fmtMoney, fmtPct } from "@/lib/diva/forecast-engine";
import { useForecastingStore } from "@/lib/diva/store/forecasting-store";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import type { ForecastInput } from "@/types/diva/forecasting";

const COLORS = ["#34d399", "#D4AF37", "#f87171", "#818cf8"];

type Scenario = ForecastInput & { name: string; color: string };

function ScenarioEditor({ s, idx, onChange }: { s: Scenario; idx: number; onChange: (s: Scenario) => void }) {
  return (
    <GlassCard className="p-4 space-y-3" style={{ borderColor: s.color + "30" }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
        <input value={s.name} onChange={e => onChange({ ...s, name: e.target.value })}
          className="text-sm font-semibold text-white bg-transparent border-none outline-none flex-1" />
      </div>
      {[
        { key: "initialAmount" as const, label: "Initial ($)", min: 0, max: 500000, step: 1000 },
        { key: "contributionAmount" as const, label: "Monthly ($)", min: 0, max: 10000, step: 100 },
        { key: "durationYears" as const, label: "Years", min: 1, max: 40, step: 1 },
        { key: "growthRate" as const, label: "Rate (%)", min: 0, max: 30, step: 0.5 },
      ].map(({ key, label, min, max, step }) => (
        <div key={key}>
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-white/40">{label}</span>
            <span className="text-[11px] font-mono" style={{ color: s.color }}>
              {key === "growthRate" ? `${s[key]}%` : key === "durationYears" ? `${s[key]}y` : fmtMoney(s[key])}
            </span>
          </div>
          <input type="range" min={min} max={max} step={step} value={s[key]}
            onChange={e => onChange({ ...s, [key]: Number(e.target.value) })}
            className="w-full h-1 rounded-full appearance-none cursor-pointer bg-white/10"
            style={{ accentColor: s.color }}
          />
        </div>
      ))}
    </GlassCard>
  );
}

export function ScenarioComparison() {
  const { compareScenarios, setCompareScenarios } = useForecastingStore();
  const [scenarios, setScenarios] = useState(compareScenarios);

  const results = scenarios.map(s => calcForecast(s));

  // Build unified chart data
  const maxYears = Math.max(...scenarios.map(s => s.durationYears));
  const chartData = Array.from({ length: maxYears + 1 }, (_, yr) => {
    const point: Record<string, number | string> = { year: yr === 0 ? "Now" : `Y${yr}` };
    results.forEach((r, i) => {
      const dp = r.dataPoints[yr];
      if (dp) point[scenarios[i].name] = dp.balance;
    });
    return point;
  });

  function updateScenario(idx: number, s: Scenario) {
    const next = [...scenarios];
    next[idx] = s;
    setScenarios(next);
    setCompareScenarios(next);
  }

  return (
    <div className="space-y-6">
      {/* Scenario editors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((s, i) => (
          <ScenarioEditor key={i} s={s} idx={i} onChange={s => updateScenario(i, s)} />
        ))}
      </div>

      {/* Comparison chart */}
      <GlassCard className="p-6">
        <h3 className="text-sm font-medium text-white/60 mb-4">Portfolio Growth Comparison</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="year" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={v => fmtMoney(v)} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} width={65} />
            <Tooltip
              formatter={(v: any, name: any) => [fmtMoney(Number(v)), name]}
              contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }} />
            {scenarios.map((s, i) => (
              <Line key={i} type="monotone" dataKey={s.name} stroke={s.color} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Side-by-side summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((s, i) => {
          const r = results[i];
          return (
            <GlassCard key={i} className="p-5" style={{ borderColor: s.color + "25" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                <span className="text-sm font-semibold text-white">{s.name}</span>
              </div>
              {[
                { label: "Final Value", value: fmtMoney(r.projectedValue), color: s.color },
                { label: "Total Contributions", value: fmtMoney(r.totalContributions), color: "text-white/60" },
                { label: "Est. Growth", value: fmtMoney(r.estimatedGrowth), color: "text-emerald-400" },
                { label: "CAGR", value: fmtPct(r.cagr), color: "text-blue-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-white/[0.04] last:border-0">
                  <span className="text-xs text-white/40">{label}</span>
                  <span className={`text-xs font-semibold ${color}`}>{value}</span>
                </div>
              ))}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
