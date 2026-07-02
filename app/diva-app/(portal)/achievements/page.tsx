import { getMyAchievements } from "@/actions/diva/achievements";
import { getMyRewards } from "@/actions/diva/rewards";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Trophy, Star, Gift, Lock } from "lucide-react";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const rewardTypeColor: Record<string, string> = {
  POINTS: "text-[#D4AF37] bg-[#D4AF37]/10",
  BADGE: "text-purple-400 bg-purple-400/10",
  CREDIT: "text-emerald-400 bg-emerald-400/10",
  TIER_ADVANCEMENT: "text-blue-400 bg-blue-400/10",
};

export default async function AchievementsPage() {
  const [achRes, rewardRes] = await Promise.all([
    getMyAchievements(),
    getMyRewards(),
  ]);

  const achievements = achRes.data ?? [];
  const rewards = rewardRes.data ?? [];
  const earned = achievements.filter((a) => a.earned);
  const locked = achievements.filter((a) => !a.earned);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Achievements & Rewards</h1>
        <p className="text-sm text-white/40 mt-1">Track your milestones and collected rewards on STICKO</p>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="p-4 text-center">
          <Trophy className="w-5 h-5 text-[#D4AF37] mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{earned.length}</p>
          <p className="text-xs text-white/40">Achievements</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <Lock className="w-5 h-5 text-white/30 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{locked.length}</p>
          <p className="text-xs text-white/40">Remaining</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <Gift className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{rewards.length}</p>
          <p className="text-xs text-white/40">Rewards</p>
        </GlassCard>
      </div>

      {/* Achievements Grid */}
      {achievements.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-4xl mb-3">🏅</p>
          <p className="text-white/40 text-sm">No achievements configured yet. Ask admin to set them up.</p>
        </GlassCard>
      ) : (
        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Badges</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {achievements.map((a) => (
              <div
                key={a.id}
                className={`relative rounded-2xl border p-4 text-center transition-all ${
                  a.earned
                    ? "border-[#D4AF37]/30 bg-[#D4AF37]/5"
                    : "border-white/[0.06] bg-white/[0.02] opacity-50"
                }`}
              >
                {!a.earned && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-3 h-3 text-white/20" />
                  </div>
                )}
                <p className="text-3xl mb-2" style={{ filter: a.earned ? "none" : "grayscale(1)" }}>
                  {a.badgeIcon}
                </p>
                <p className="text-white text-xs font-semibold leading-tight">{a.name}</p>
                <p className="text-white/30 text-[10px] mt-1 leading-tight">{a.description}</p>
                {a.earned && a.earnedAt && (
                  <p className="text-[#D4AF37] text-[10px] mt-2 font-medium">{fmtDate(a.earnedAt)}</p>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Rewards History */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-white mb-5">Rewards History</h2>
        {rewards.length === 0 ? (
          <p className="text-center text-white/30 text-sm py-8">No rewards yet — complete achievements to earn rewards!</p>
        ) : (
          <div className="space-y-3">
            {rewards.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                    <Gift className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{r.rewardName}</p>
                    <p className="text-white/30 text-xs">{fmtDate(r.awardedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${rewardTypeColor[r.rewardType] ?? "text-white/40 bg-white/5"}`}>
                    {r.rewardType}
                  </span>
                  <p className="text-white font-semibold text-sm">{r.rewardValue}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
