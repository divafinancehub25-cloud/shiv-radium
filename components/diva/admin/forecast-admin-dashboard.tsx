"use client";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { fmtPct } from "@/lib/diva/forecast-engine";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Users, Target, Layers } from "lucide-react";

type Stats = {
  totalScenarios: number;
  totalMilestones: number;
  activeUsers: number;
  avgGrowthRate: number;
  topScenarios: { scenarioName: string; count: number }[];
  milestoneByStatus: { status: string; count: number }[];
};

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "#D4AF37",
  ACHIEVED: "#34d399",
  MISSED: "#f87171",
  CANCELLED: "#6b7280",
};

export function ForecastAdminDashboard({ stats }: { stats: Stats }) {
  const kpis = [
    { label: "Total Scenarios", value: stats.totalScenarios, icon: Layers, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
    { label: "Total Milestones", value: stats.totalMilestones, icon: Target, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Active Planners", value: stats.activeUsers, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Avg. Growth Rate", value: fmtPct(stats.avgGrowthRate), icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-400/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <GlassCard key={label} className="p-5">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xs text-white/40">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top scenarios bar chart */}
        <GlassCard className="p-6">
          <h3 className="text-sm font-medium text-white/60 mb-4">Top Scenario Names</h3>
          {stats.topScenarios.length === 0 ? (
            <p className="text-white/20 text-xs text-center py-8">No scenarios yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.topScenarios} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="scenarioName" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }} width={100} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="count" fill="#D4AF37" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </GlassCard>

        {/* Milestone status pie */}
        <GlassCard className="p-6">
          <h3 className="text-sm font-medium text-white/60 mb-4">Milestone Status Distribution</h3>
          {stats.milestoneByStatus.length === 0 ? (
            <p className="text-white/20 text-xs text-center py-8">No milestones yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stats.milestoneByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {stats.milestoneByStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] ?? "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
