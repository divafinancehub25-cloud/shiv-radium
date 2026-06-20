import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { GlassCard } from "@/components/diva/ui/glass-card";
import Link from "next/link";
import { getUserInsights } from "@/actions/diva/forecasting";
import { fmtMoney } from "@/lib/diva/forecast-engine";
import { Calculator, TrendingUp, Flag, BarChart3, Download, Layers } from "lucide-react";

export const metadata = { title: "Forecasting Hub — DIVA" };

const TOOLS = [
  { href: "/diva-app/forecasting/calculator", icon: Calculator, title: "Future Value Calculator", desc: "Compute projected portfolio value with compound interest" },
  { href: "/diva-app/forecasting/scenarios", icon: Layers, title: "Scenario Planning", desc: "Build, compare, and save multiple growth scenarios" },
  { href: "/diva-app/forecasting/dashboard", icon: TrendingUp, title: "Forecast Dashboard", desc: "1Y / 3Y / 5Y interactive projections from your balance" },
  { href: "/diva-app/forecasting/milestones", icon: Flag, title: "Milestone Planner", desc: "Set financial targets and track your progress" },
  { href: "/diva-app/forecasting/insights", icon: BarChart3, title: "Insights & Analytics", desc: "Historical performance and AI-powered insights" },
  { href: "/diva-app/forecasting/export", icon: Download, title: "Export Center", desc: "Download PDF reports and CSV data" },
];

export default async function ForecastingHubPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/diva-app/login");

  const insightsRes = await getUserInsights();
  const insights = "error" in insightsRes ? null : insightsRes;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Forecasting & Planning</h1>
        <p className="text-white/40 text-sm">Model your financial future with powerful calculation tools</p>
      </div>

      {insights && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Current Balance", value: fmtMoney(insights.balance) },
            { label: "Total Deposited", value: fmtMoney(insights.totalDeposited) },
            { label: "Scenarios", value: String(insights.scenarioCount) },
            { label: "Deposits", value: String(insights.depositCount) },
          ].map(({ label, value }) => (
            <GlassCard key={label} className="p-4 text-center">
              <p className="text-xs text-white/30 mb-1">{label}</p>
              <p className="text-lg font-bold text-[#D4AF37]">{value}</p>
            </GlassCard>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOLS.map(({ href, icon: Icon, title, desc }) => (
          <Link key={href} href={href}>
            <GlassCard className="p-6 hover:border-[#D4AF37]/20 transition-colors cursor-pointer group h-full">
              <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mb-4 group-hover:bg-[#D4AF37]/20 transition-colors">
                <Icon className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
              <p className="text-xs text-white/30">{desc}</p>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
