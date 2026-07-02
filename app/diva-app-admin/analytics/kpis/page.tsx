import { adminGetAllKpis, adminRecordKpiValues, adminSeedDefaultKpis } from "@/actions/diva/kpi";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { KpiCardWidget } from "@/components/diva/analytics/kpi-card";
import { getKpiCards } from "@/actions/diva/kpi";
import { SeedKpisBtn } from "@/components/diva/admin/seed-kpis-btn";
import { RecordKpiBtn } from "@/components/diva/admin/record-kpi-btn";
import { CreateKpiForm } from "@/components/diva/admin/create-kpi-form";

export default async function KpiMonitorPage() {
  const [kpiCardsRes, allKpisRes] = await Promise.all([
    getKpiCards(),
    adminGetAllKpis(),
  ]);

  const kpiCards = kpiCardsRes.data ?? [];
  const allKpis = "data" in allKpisRes ? (allKpisRes.data ?? []) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">KPI Monitoring Center</h1>
          <p className="text-sm text-white/40 mt-1">Configure and track platform KPIs</p>
        </div>
        <div className="flex gap-2">
          <SeedKpisBtn />
          <RecordKpiBtn />
        </div>
      </div>

      {/* Live KPI Cards */}
      {kpiCards.length > 0 && (
        <div>
          <p className="text-xs text-white/30 uppercase tracking-wider font-medium mb-3">Live KPIs</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {kpiCards.map((k) => <KpiCardWidget key={k.id} kpi={k} />)}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All KPI Definitions */}
        <GlassCard className="p-6">
          <p className="text-sm font-semibold text-white mb-5">All KPI Definitions ({allKpis.length})</p>
          {allKpis.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-white/40 text-sm mb-2">No KPIs configured</p>
              <p className="text-white/20 text-xs">Click "Seed Defaults" to add standard KPIs</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allKpis.map((k: any) => (
                <div key={k.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${k.isActive ? "bg-emerald-400" : "bg-white/20"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{k.name}</p>
                    {k.description && <p className="text-white/30 text-xs mt-0.5">{k.description}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-white/20">Formula: {k.formula}</span>
                      {k.target != null && <span className="text-[10px] text-[#D4AF37]">Target: {k.target}{k.unit}</span>}
                    </div>
                  </div>
                  {k.currentValue != null && (
                    <div className="text-right shrink-0">
                      <p className="text-white font-semibold text-sm">{k.currentValue}</p>
                      <p className="text-white/20 text-[10px]">{k.unit}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Create KPI Form */}
        <GlassCard className="p-6">
          <p className="text-sm font-semibold text-white mb-5">Create KPI</p>
          <CreateKpiForm />
        </GlassCard>
      </div>
    </div>
  );
}
