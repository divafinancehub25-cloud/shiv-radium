import { getReferralStats, getMyReferrals } from "@/actions/diva/referral";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Users, UserCheck, Clock, Star, Link2 } from "lucide-react";
import { ReferralLinkBox } from "@/components/diva/referral/referral-link-box";
import { ReferralTable } from "@/components/diva/referral/referral-table";

export default async function ReferralsPage() {
  const [statsRes, referralsRes] = await Promise.all([
    getReferralStats(),
    getMyReferrals(),
  ]);

  const stats = statsRes.data;
  const referrals = referralsRes.data ?? [];

  const statCards = [
    { label: "Total Referrals", value: stats?.totalReferrals ?? 0, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Activated", value: stats?.successfulReferrals ?? 0, icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Pending", value: stats?.pendingReferrals ?? 0, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { label: "Points Earned", value: Math.floor(stats?.pointsEarned ?? 0), icon: Star, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Referral Program</h1>
        <p className="text-sm text-white/40 mt-1">Invite friends to STICKO and earn rewards together</p>
      </div>

      {/* Referral Card */}
      {stats && (
        <GlassCard className="p-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#D4AF37]/8 blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-4 h-4 text-[#D4AF37]" />
                <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Your Unique Referral Code</p>
              </div>
              <p className="text-4xl font-bold text-white font-mono tracking-widest mb-5">{stats.referralCode}</p>
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 mb-4">
                <p className="flex-1 text-xs text-white/50 truncate">{stats.referralLink}</p>
              </div>
              <ReferralLinkBox referralLink={stats.referralLink} />
            </div>
            <div className="flex flex-col items-center bg-[#D4AF37]/8 border border-[#D4AF37]/20 rounded-2xl p-6 text-center min-w-[150px]">
              <p className="text-5xl font-bold text-[#D4AF37]">{stats.totalReferrals}</p>
              <p className="text-xs text-white/40 mt-1 mb-4">Invites Sent</p>
              <div className="w-full h-px bg-white/10 mb-4" />
              <p className="text-2xl font-semibold text-emerald-400">{stats.successfulReferrals}</p>
              <p className="text-xs text-white/40 mt-1">Activated</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s) => (
          <GlassCard key={s.label} className="p-4">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Table */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-white mb-5">My Referrals ({referrals.length})</h2>
        <ReferralTable referrals={referrals} />
      </GlassCard>
    </div>
  );
}
