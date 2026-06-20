import { getUserDetail } from "@/actions/diva/admin";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { StatusBadge } from "@/components/diva/ui/status-badge";
import { KYCReviewPanel } from "@/components/diva/admin/kyc-review-panel";
import { ArrowLeft, Monitor, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserDetail(id);
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/diva-admin/users" className="text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-white">{user.name}</h1>
        <StatusBadge status={user.divaProfile?.accountStatus ?? "PENDING_VERIFICATION"} />
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          {user.divaKYC
            ? <KYCReviewPanel kyc={{ ...user.divaKYC, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } } as never} />
            : <GlassCard className="p-6 text-center text-sm text-zinc-500">No KYC submission yet</GlassCard>}
        </div>
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="p-5 space-y-3">
            <h3 className="text-sm font-medium text-zinc-400">Account Info</h3>
            {[["Email", user.email], ["Phone", user.phone ?? "—"], ["Country", user.divaProfile?.country ?? "—"], ["Referral Code", user.divaProfile?.referralCode ?? "—"], ["Joined", new Date(user.createdAt).toLocaleDateString()]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-zinc-500">{k}</span>
                <span className="text-zinc-300 text-xs">{v}</span>
              </div>
            ))}
          </GlassCard>
          {user.divaLoginHistory.length > 0 && (
            <GlassCard className="p-5 space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                <Monitor size={14} /> Recent Logins
              </h3>
              {user.divaLoginHistory.slice(0, 5).map((h) => (
                <div key={h.id} className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <StatusBadge status={h.status} className="text-[10px]" />
                    <span className="text-zinc-600">{new Date(h.createdAt).toLocaleDateString()}</span>
                  </div>
                  {h.ipAddress && <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-600"><MapPin size={10} /> {h.ipAddress}</p>}
                </div>
              ))}
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
