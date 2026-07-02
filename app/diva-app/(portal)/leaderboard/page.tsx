"use client";

import { useState, useEffect } from "react";
import { getLeaderboard } from "@/actions/diva/referral";
import { GlassCard } from "@/components/diva/ui/glass-card";
import type { LeaderboardEntry } from "@/types/diva/referral";

type Period = "weekly" | "monthly" | "all_time";

const PERIODS: { value: Period; label: string }[] = [
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
  { value: "all_time", label: "All Time" },
];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("all_time");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(period).then((res) => {
      setEntries(res.data ?? []);
      setLoading(false);
    });
  }, [period]);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-sm text-white/40 mt-1">Top referrers on STICKO Growth Capital</p>
        </div>
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p.value
                  ? "bg-[#D4AF37] text-black"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-white/40 text-sm">No referral data for this period yet.</p>
        </GlassCard>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[top3[1], top3[0], top3[2]].map((e, i) => {
                if (!e) return <div key={i} />;
                const podiumOrder = [2, 1, 3];
                const rank = podiumOrder[i];
                const heights = ["h-24", "h-32", "h-20"];
                const golds = ["border-zinc-600", "border-[#D4AF37]", "border-amber-700"];
                return (
                  <GlassCard key={e.userId} className={`p-4 text-center border ${golds[i]} flex flex-col items-center justify-end ${heights[i]}`}>
                    <p className="text-2xl mb-1">{e.badge}</p>
                    <p className="text-white font-semibold text-xs truncate w-full text-center">{e.name}</p>
                    <p className="text-[#D4AF37] text-xs font-bold">{e.totalReferrals} referrals</p>
                    <p className="text-white/30 text-[10px] mt-0.5">#{rank}</p>
                  </GlassCard>
                );
              })}
            </div>
          )}

          {/* Full Table */}
          <GlassCard className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left pb-3 text-xs text-white/30 font-medium w-10">Rank</th>
                    <th className="text-left pb-3 text-xs text-white/30 font-medium">Member</th>
                    <th className="text-right pb-3 text-xs text-white/30 font-medium">Referrals</th>
                    <th className="text-right pb-3 text-xs text-white/30 font-medium hidden sm:table-cell">Activated</th>
                    <th className="text-right pb-3 text-xs text-white/30 font-medium hidden md:table-cell">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {entries.map((e) => (
                    <tr key={e.userId}>
                      <td className="py-3 pr-3">
                        <span className="text-white/40 font-mono text-xs">#{e.rank}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{e.badge}</span>
                          <div>
                            <p className="text-white font-medium text-sm">{e.name}</p>
                            <p className="text-white/30 text-xs">{e.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right text-[#D4AF37] font-semibold">{e.totalReferrals}</td>
                      <td className="py-3 pr-4 text-right text-emerald-400 hidden sm:table-cell">{e.successfulReferrals}</td>
                      <td className="py-3 text-right text-white/40 hidden md:table-cell">{e.pointsEarned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
