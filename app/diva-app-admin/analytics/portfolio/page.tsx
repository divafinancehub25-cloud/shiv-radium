import { getPortfolioAnalytics } from "@/actions/diva/analytics";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { DivaBarChart } from "@/components/diva/charts/bar-chart";
import { DivaPieChart } from "@/components/diva/charts/pie-chart";

export default async function PortfolioAnalyticsPage() {
  const res = await getPortfolioAnalytics();
  const data = res.data;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Portfolio Analytics</h1>
        <p className="text-sm text-white/40 mt-1">Portfolio distribution, value and growth</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Value", value: `$${(data?.totalValue ?? 0).toLocaleString()}`, color: "text-[#D4AF37]" },
          { label: "Active Portfolios", value: data?.activeCount ?? 0, color: "text-emerald-400" },
          { label: "Avg Balance", value: `$${(data?.avgBalance ?? 0).toFixed(2)}`, color: "text-blue-400" },
        ].map((s) => (
          <GlassCard key={s.label} className="p-5">
            <p className="text-xs text-white/40 mb-2">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <p className="text-sm font-semibold text-white mb-5">New Portfolios (30 Days)</p>
          <DivaBarChart data={data?.valueSeries ?? []} color="#8b5cf6" height={220} />
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-sm font-semibold text-white mb-5">Status Distribution</p>
          {(data?.statusBreakdown?.length ?? 0) > 0
            ? <DivaPieChart data={data?.statusBreakdown ?? []} height={240} />
            : <p className="text-center text-white/30 text-sm py-16">No data yet</p>}
        </GlassCard>
      </div>
    </div>
  );
}
