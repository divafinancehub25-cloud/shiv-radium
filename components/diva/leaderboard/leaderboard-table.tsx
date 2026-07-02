"use client";

import { useState } from "react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Trophy, Star, Users } from "lucide-react";
import type { LeaderboardEntry } from "@/types/diva/referral";

type Period = "weekly" | "monthly" | "all_time";

const periods: { value: Period; label: string }[] = [
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
  { value: "all_time", label: "All Time" },
];

const rankColors = ["text-yellow-400", "text-zinc-400", "text-amber-700"];
const rankBgs = ["bg-yellow-400/10", "bg-zinc-400/10", "bg-amber-700/10"];

export function LeaderboardTable({
  entries,
  currentUserId,
  period,
  onPeriodChange,
}: {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  period: Period;
  onPeriodChange: (p: Period) => void;
}) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="text-sm font-semibold text-white">Top Referrers</h3>
        </div>
        <div className="flex gap-1 rounded-xl bg-white/[0.05] p-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                period === p.value ? "bg-[#D4AF37] text-black" : "text-white/40 hover:text-white/70"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!entries.length ? (
        <div className="py-12 text-center text-white/20 text-sm">No data yet for this period</div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {entries.map((e) => {
            const isMe = e.userId === currentUserId;
            const rankColor = e.rank <= 3 ? rankColors[e.rank - 1] : "text-white/40";
            const rankBg = e.rank <= 3 ? rankBgs[e.rank - 1] : "bg-white/[0.05]";

            return (
              <div
                key={e.userId}
                className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${isMe ? "bg-[#D4AF37]/[0.04]" : "hover:bg-white/[0.02]"}`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${rankBg}`}>
                  <span className={`text-sm font-bold ${rankColor}`}>{e.rank}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold truncate ${isMe ? "text-[#D4AF37]" : "text-white"}`}>
                      {e.name} {isMe && <span className="text-[10px] text-[#D4AF37]/60">(you)</span>}
                    </p>
                    <span className="text-base">{e.badge}</span>
                  </div>
                  <p className="text-xs text-white/30 truncate">{e.email}</p>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-sm font-bold text-white">{e.totalReferrals}</p>
                    <p className="text-[10px] text-white/30">referrals</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-400">{e.successfulReferrals}</p>
                    <p className="text-[10px] text-white/30">activated</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-[#D4AF37]" />
                      <p className="text-sm font-bold text-[#D4AF37]">{e.pointsEarned}</p>
                    </div>
                    <p className="text-[10px] text-white/30">points</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
