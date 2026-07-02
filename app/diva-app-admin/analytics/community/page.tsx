import { getCommunityAnalytics } from "@/actions/diva/analytics";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Megaphone, Bookmark, Trophy, Gift } from "lucide-react";

export default async function CommunityAnalyticsPage() {
  const res = await getCommunityAnalytics();
  const data = "data" in res ? res.data : null;

  const stats = data ? [
    { label: "Published Announcements", value: data.published, icon: Megaphone, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Total Bookmarks", value: data.bookmarks, icon: Bookmark, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
    { label: "Achievements Earned", value: data.userAchievements, icon: Trophy, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Rewards Granted", value: data.rewards, icon: Gift, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ] : [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Community Analytics</h1>
        <p className="text-sm text-white/40 mt-1">Engagement, announcements and achievements overview</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <GlassCard key={s.label} className="p-5">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <p className="text-sm font-semibold text-white mb-4">Platform Summary</p>
          <div className="space-y-3">
            {data && [
              { label: "Total Announcements", value: data.totalAnnouncements },
              { label: "Published", value: data.published },
              { label: "Engagement Rate", value: `${data.engagementRate}%` },
              { label: "Active Achievements", value: data.achievements },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <p className="text-sm text-white/60">{r.label}</p>
                <p className="text-sm font-semibold text-white">{r.value}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <p className="text-sm font-semibold text-white mb-4">Most Bookmarked Announcements</p>
          {(data?.topAnnouncements?.length ?? 0) === 0 ? (
            <p className="text-center text-white/30 text-sm py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {data?.topAnnouncements?.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-white/30 text-xs w-5 shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{a.title}</p>
                    <p className="text-white/30 text-[10px]">{a.category}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[#D4AF37]">
                    <Bookmark className="w-3 h-3" />
                    <span className="text-xs font-semibold">{a.bookmarks}</span>
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
