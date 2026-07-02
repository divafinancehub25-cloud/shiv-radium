"use client";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { fmtMoney } from "@/lib/diva/forecast-engine";
import { TrendingUp, Activity, Target, Layers, AlertCircle, CheckCircle2 } from "lucide-react";

type InsightData = {
  balance: number;
  totalDeposited: number;
  last30Deposited: number;
  depositCount: number;
  scenarioCount: number;
  portfolioStatus: string;
};

export function PortfolioInsights({ data }: { data: InsightData }) {
  const growthEstimate8 = data.balance * Math.pow(1.08, 5);
  const growthEstimate12 = data.balance * Math.pow(1.12, 5);
  const avgDeposit = data.depositCount > 0 ? data.totalDeposited / data.depositCount : 0;

  const insights = [
    {
      icon: TrendingUp,
      color: "text-[#D4AF37]",
      bg: "bg-[#D4AF37]/10",
      title: "5-Year Projection at 8%",
      value: fmtMoney(growthEstimate8),
      sub: `Current balance growing at conservative 8% annually`,
    },
    {
      icon: Activity,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      title: "Optimistic 5-Year (12%)",
      value: fmtMoney(growthEstimate12),
      sub: `At 12% annual growth rate`,
    },
    {
      icon: Layers,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      title: "Total Capital Deployed",
      value: fmtMoney(data.totalDeposited),
      sub: `Across ${data.depositCount} approved deposit${data.depositCount !== 1 ? "s" : ""}`,
    },
    {
      icon: Target,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      title: "Average Deposit Size",
      value: fmtMoney(avgDeposit),
      sub: `Based on your deposit history`,
    },
    {
      icon: Activity,
      color: "text-pink-400",
      bg: "bg-pink-400/10",
      title: "Last 30 Days",
      value: fmtMoney(data.last30Deposited),
      sub: `New capital added in the past month`,
    },
    {
      icon: Layers,
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
      title: "Active Scenarios",
      value: String(data.scenarioCount),
      sub: `Forecast scenarios saved`,
    },
  ];

  const tips: { type: "warn" | "ok"; message: string }[] = [];
  if (data.scenarioCount === 0) tips.push({ type: "warn", message: "Create your first scenario to start forecasting your portfolio growth." });
  if (data.last30Deposited === 0) tips.push({ type: "warn", message: "No deposits in the last 30 days. Regular contributions accelerate portfolio growth." });
  if (data.balance > 0 && data.scenarioCount > 0) tips.push({ type: "ok", message: "You have active scenarios — your planning is on track!" });
  if (data.depositCount >= 3) tips.push({ type: "ok", message: "Strong deposit history — consistency is key to compounding growth." });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map(({ icon: Icon, color, bg, title, value, sub }) => (
          <GlassCard key={title} className="p-5">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <p className="text-xs text-white/40 mb-0.5">{title}</p>
            <p className={`text-xl font-bold ${color} mb-1`}>{value}</p>
            <p className="text-[11px] text-white/25">{sub}</p>
          </GlassCard>
        ))}
      </div>

      {tips.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Insights & Recommendations</h3>
          <div className="space-y-2">
            {tips.map((tip, i) => (
              <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl ${tip.type === "warn" ? "bg-amber-400/5 border border-amber-400/10" : "bg-emerald-400/5 border border-emerald-400/10"}`}>
                {tip.type === "warn"
                  ? <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                  : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />}
                <p className={`text-xs ${tip.type === "warn" ? "text-amber-200/70" : "text-emerald-200/70"}`}>{tip.message}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
