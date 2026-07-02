import { adminGetAchievements, adminSeedDefaultAchievements } from "@/actions/diva/achievements";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Trophy } from "lucide-react";
import { SeedAchievementsBtn } from "@/components/diva/admin/seed-achievements-btn";
import { CreateAchievementForm } from "@/components/diva/admin/create-achievement-form";

export default async function AdminAchievementsPage() {
  const res = await adminGetAchievements();
  const achievements = "data" in res ? (res.data ?? []) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Achievement Engine</h1>
          <p className="text-sm text-white/40 mt-1">Manage badges and achievements for STICKO members</p>
        </div>
        <SeedAchievementsBtn />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievement List */}
        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold text-white mb-5">All Achievements ({achievements.length})</h2>
          {achievements.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">🏅</p>
              <p className="text-white/40 text-sm mb-4">No achievements yet</p>
              <p className="text-white/20 text-xs">Click "Seed Defaults" to add 6 standard badges</p>
            </div>
          ) : (
            <div className="space-y-3">
              {achievements.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-2xl">{a.badgeIcon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{a.name}</p>
                    <p className="text-white/40 text-xs">{a.description}</p>
                    <p className="text-white/20 text-[10px] mt-0.5">Trigger: {a.trigger}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${a.isActive ? "bg-emerald-400" : "bg-white/20"}`} />
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Create Achievement */}
        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#D4AF37]" /> Create Achievement
          </h2>
          <CreateAchievementForm />
        </GlassCard>
      </div>
    </div>
  );
}
