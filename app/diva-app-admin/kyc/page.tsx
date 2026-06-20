import { GlassCard } from "@/components/diva/ui/glass-card";

export const metadata = { title: "KYC Review — DIVA Admin" };

export default function DivaAdminKYCPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">KYC Review Queue</h1>
      <GlassCard className="p-6 text-white/40 text-sm text-center py-12">
        No pending KYC submissions at this time.
      </GlassCard>
    </div>
  );
}
