import { GlassCard } from "@/components/diva/ui/glass-card";

export const metadata = { title: "Admin Dashboard — DIVA Growth Capital" };

export default function DivaAdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Members", value: "—" },
          { label: "Pending KYC", value: "—" },
          { label: "Active Today", value: "—" },
        ].map((s) => (
          <GlassCard key={s.label} className="p-5">
            <p className="text-white/40 text-xs uppercase tracking-widest">{s.label}</p>
            <p className="text-3xl font-semibold text-white mt-2">{s.value}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
