"use client";
import { GlassCard } from "@/components/diva/ui/glass-card";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, LineChart, Line, Legend,
} from "recharts";
import { DollarSign, Users, TrendingUp, Clock } from "lucide-react";

type Stats = {
  totalUsers: number;
  activePortfolios: number;
  totalPlatformBalance: string;
  totalDeposited: string;
  totalAdjusted: string;
  pendingDeposits: number;
  trend: { date: string; credits: number; debits: number }[];
};

function fmt(v: string) {
  return Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PortfolioAnalytics({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Platform Balance", value: `$${fmt(stats.totalPlatformBalance)}`, icon: DollarSign, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
          { label: "Total Deposited", value: `$${fmt(stats.totalDeposited)}`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Active Portfolios", value: String(stats.activePortfolios), icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Pending Deposits", value: String(stats.pendingDeposits), icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <GlassCard key={label} className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <span className="text-xs text-white/40">{label}</span>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </GlassCard>
        ))}
      </div>

      {/* Trend chart */}
      <GlassCard className="p-6">
        <h3 className="text-sm font-medium text-white/60 mb-4">Platform Activity (14 days)</h3>
        {stats.trend.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-white/20 text-sm">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                labelStyle={{ color: "rgba(255,255,255,0.6)" }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }} />
              <Bar dataKey="credits" name="Credits" fill="#D4AF37" radius={[3, 3, 0, 0]} />
              <Bar dataKey="debits" name="Debits" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </GlassCard>
    </div>
  );
}
