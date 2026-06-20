"use client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { GlassCard } from "@/components/diva/ui/glass-card";

type Point = { date: string; balance: number; deposits: number; adjustments: number };

export function BalanceTrendChart({ data }: { data: Point[] }) {
  return (
    <GlassCard className="p-6">
      <h3 className="text-sm font-medium text-white/60 mb-4">Balance Trend (30 days)</h3>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-white/20 text-sm">
          No activity yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
              labelStyle={{ color: "rgba(255,255,255,0.6)" }}
              itemStyle={{ color: "#D4AF37" }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }} />
            <Area type="monotone" dataKey="balance" name="Balance" stroke="#D4AF37" fill="url(#goldGrad)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="deposits" name="Deposits" stroke="#34d399" fill="url(#greenGrad)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </GlassCard>
  );
}
