"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Layers, Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { adminDepositStats } from "@/actions/diva/deposits";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

const STATUS_COLORS = { PENDING: "#F59E0B", UNDER_REVIEW: "#3B82F6", APPROVED: "#10B981", REJECTED: "#EF4444" };
const NET_COLORS = ["#D4AF37", "#F5D76E", "#B8962E", "#8B7021", "#6B5518"];

type Stats = Awaited<ReturnType<typeof adminDepositStats>>;

export function DepositStatsPanel() {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminDepositStats().then((d) => { setData(d as any); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array(5).fill(0).map((_, i) => (
          <GlassCard key={i} className="p-5 h-24 animate-pulse">{null}</GlassCard>
        ))}
      </div>
    );
  }
  if (!data || "error" in data) return null;

  const { stats, networkDist, statusBreakdown, dailyActivity } = data as any;

  const statCards = [
    { label: "Total Deposits", value: stats.total,       icon: Layers,      color: "text-white" },
    { label: "Pending",        value: stats.pending,      icon: Clock,       color: "text-amber-400" },
    { label: "Approved",       value: stats.approved,     icon: CheckCircle, color: "text-emerald-400" },
    { label: "Rejected",       value: stats.rejected,     icon: XCircle,     color: "text-red-400" },
    { label: "Total Volume",   value: `$${parseFloat(stats.totalVolume).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-[#D4AF37]" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <GlassCard className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/30 text-xs uppercase tracking-wider">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </div>
                <s.icon className={`h-5 w-5 mt-1 ${s.color} opacity-60`} />
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity area chart */}
        <GlassCard className="p-5 lg:col-span-2">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-4">7-Day Deposit Activity</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dailyActivity}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: "#ffffff30", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#ffffff30", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#111", border: "1px solid #ffffff15", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "#ffffff60" }}
              />
              <Area type="monotone" dataKey="count" stroke="#D4AF37" strokeWidth={2} fill="url(#goldGrad)" name="Deposits" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Status pie */}
        <GlassCard className="p-5">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-4">Status Breakdown</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusBreakdown} cx="50%" cy="50%" outerRadius={65} dataKey="count" nameKey="status" label={false}>
                {statusBreakdown.map((s: any) => (
                  <Cell key={s.status} fill={(STATUS_COLORS as any)[s.status] ?? "#888"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#111", border: "1px solid #ffffff15", borderRadius: 12, fontSize: 12 }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#ffffff60" }} />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Network distribution bar */}
      {networkDist.length > 0 && (
        <GlassCard className="p-5">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-4">Network Distribution</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={networkDist} layout="vertical">
              <XAxis type="number" tick={{ fill: "#ffffff30", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="network" tick={{ fill: "#ffffff60", fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: "#111", border: "1px solid #ffffff15", borderRadius: 12, fontSize: 12 }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Deposits">
                {networkDist.map((_: any, i: number) => (
                  <Cell key={i} fill={NET_COLORS[i % NET_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      )}
    </div>
  );
}
