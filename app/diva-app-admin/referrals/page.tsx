import { adminGetAllReferrals, getLeaderboard } from "@/actions/diva/referral";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { GitBranch, Users, UserCheck, Trophy } from "lucide-react";

const statusColors: Record<string, string> = {
  PENDING: "text-yellow-400 bg-yellow-400/10",
  CLICKED: "text-blue-400 bg-blue-400/10",
  REGISTERED: "text-purple-400 bg-purple-400/10",
  KYC_COMPLETED: "text-cyan-400 bg-cyan-400/10",
  ACTIVATED: "text-emerald-400 bg-emerald-400/10",
  EXPIRED: "text-red-400 bg-red-400/10",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AdminReferralsPage() {
  const [referralsRes, leaderRes] = await Promise.all([
    adminGetAllReferrals(1, 50),
    getLeaderboard("all_time"),
  ]);

  const referrals = "data" in referralsRes ? (referralsRes.data ?? []) : [];
  const total = "total" in referralsRes ? referralsRes.total : 0;
  const leaders = leaderRes.data ?? [];

  const activated = referrals.filter((r: any) => r.status === "ACTIVATED").length;
  const pending = referrals.filter((r: any) => !["ACTIVATED", "EXPIRED"].includes(r.status)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Referral Management</h1>
        <p className="text-sm text-white/40 mt-1">All referrals across STICKO platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Referrals", value: total, icon: GitBranch, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Activated", value: activated, icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "In Progress", value: pending, icon: Users, color: "text-yellow-400", bg: "bg-yellow-400/10" },
          { label: "Top Referrers", value: leaders.length, icon: Trophy, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
        ].map((s) => (
          <GlassCard key={s.label} className="p-4">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* All Referrals Table */}
        <GlassCard className="p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-white mb-5">All Referrals</h2>
          {referrals.length === 0 ? (
            <p className="text-center text-white/30 text-sm py-8">No referrals yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left pb-3 text-xs text-white/30 font-medium">Referrer</th>
                    <th className="text-left pb-3 text-xs text-white/30 font-medium">Referred</th>
                    <th className="text-left pb-3 text-xs text-white/30 font-medium">Status</th>
                    <th className="text-left pb-3 text-xs text-white/30 font-medium hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {referrals.map((r: any) => (
                    <tr key={r.id}>
                      <td className="py-3 pr-4">
                        <p className="text-white text-xs font-medium truncate max-w-[120px]">{r.referrerName}</p>
                        <p className="text-white/30 text-[10px] truncate max-w-[120px]">{r.referrerEmail}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-white text-xs font-medium truncate max-w-[120px]">{r.referredName}</p>
                        <p className="text-white/30 text-[10px] truncate max-w-[120px]">{r.referredEmail}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-medium ${statusColors[r.status] ?? "text-white/40 bg-white/5"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 text-white/30 text-[10px] hidden md:table-cell">{fmtDate(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        {/* Leaderboard */}
        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Top Referrers</h2>
          {leaders.length === 0 ? (
            <p className="text-center text-white/30 text-sm py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {leaders.slice(0, 10).map((e) => (
                <div key={e.userId} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-lg w-6 text-center">{e.badge}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{e.name}</p>
                    <p className="text-white/30 text-[10px] truncate">{e.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#D4AF37] text-xs font-bold">{e.totalReferrals}</p>
                    <p className="text-white/20 text-[10px]">refs</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
