"use client";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { useWithdrawalStats } from "@/hooks/diva/use-withdrawals";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { FileText, Clock, CheckCircle2, XCircle, TrendingUp, Loader2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "#fbbf24",
  UNDER_REVIEW: "#60a5fa",
  COMPLETED: "#34d399",
  REJECTED: "#f87171",
  CANCELLED: "#6b7280",
};

function fmtMoney(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

export function FinancialOpsDashboard() {
  const { data: stats, isLoading } = useWithdrawalStats();

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => <GlassCard key={i} className="h-24 animate-pulse">{null}</GlassCard>)}
      </div>
    );
  }

  const pending = stats.submitted + stats.underReview;
  const kpis = [
    { label: "Total Requests", value: String(stats.total), icon: FileText, color: "text-white", bg: "bg-white/10" },
    { label: "Pending", value: String(pending), icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Completed", value: String(stats.completed), icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Rejected", value: String(stats.rejected), icon: XCircle, color: "text-red-400", bg: "bg-red-400/10" },
    { label: "Volume", value: fmtMoney(Number(stats.totalVolume)), icon: TrendingUp, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
  ];

  const pieData = stats.statusBreakdown.filter((s) => s.count > 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <GlassCard key={label} className="p-4">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-[11px] text-white/40">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily requests area chart */}
        <GlassCard className="p-6">
          <h3 className="text-sm font-medium text-white/60 mb-4">Daily Requests (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.dailyActivity} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="opsGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false}
                tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
              <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} />
              <Area type="monotone" dataKey="count" name="Requests" stroke="#D4AF37" fill="url(#opsGold)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Status breakdown pie */}
        <GlassCard className="p-6">
          <h3 className="text-sm font-medium text-white/60 mb-4">Status Breakdown</h3>
          {pieData.length === 0 ? (
            <p className="text-white/20 text-xs text-center py-12">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.status] ?? "#6b7280"} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </GlassCard>
      </div>

      {/* Volume trend bar */}
      <GlassCard className="p-6">
        <h3 className="text-sm font-medium text-white/60 mb-4">Withdrawal Volume Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats.dailyActivity} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false}
              tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
            <YAxis tickFormatter={(v) => fmtMoney(v)} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} width={50} />
            <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} />
            <Bar dataKey="volume" name="Volume" fill="#D4AF37" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
}
