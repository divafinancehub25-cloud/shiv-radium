import { listKYCQueue } from "@/actions/diva/admin";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { KycReviewCard } from "@/components/diva/admin/kyc-review-card";
import { ShieldCheck } from "lucide-react";

export const metadata = { title: "KYC Review — STICKO Admin" };
export const dynamic = "force-dynamic";

export default async function DivaAdminKYCPage() {
  const queue = (await listKYCQueue()) as any[];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">KYC Review Queue</h1>
        <p className="text-sm text-white/40 mt-1">{queue.length} submission{queue.length !== 1 ? "s" : ""} awaiting review</p>
      </div>

      {queue.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <ShieldCheck className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No pending KYC submissions right now.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {queue.map((kyc) => <KycReviewCard key={kyc.id} kyc={kyc} />)}
        </div>
      )}
    </div>
  );
}
