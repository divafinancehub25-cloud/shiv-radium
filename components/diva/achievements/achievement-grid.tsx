"use client";

import { GlassCard } from "@/components/diva/ui/glass-card";
import { Lock } from "lucide-react";
import type { AchievementRow } from "@/types/diva/referral";
import { cn } from "@/lib/utils";

export function AchievementGrid({ achievements }: { achievements: AchievementRow[] }) {
  const earned = achievements.filter((a) => a.earned);
  const locked = achievements.filter((a) => !a.earned);

  return (
    <div className="space-y-6">
      {earned.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">
            Earned ({earned.length})
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {earned.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">
            Locked ({locked.length})
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {locked.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </div>
      )}

      {!achievements.length && (
        <GlassCard className="p-8 text-center">
          <p className="text-white/20 text-sm">No achievements configured yet</p>
        </GlassCard>
      )}
    </div>
  );
}

function AchievementCard({ achievement: a }: { achievement: AchievementRow }) {
  return (
    <GlassCard className={cn("p-4 text-center relative overflow-hidden transition-all", a.earned ? "border-[#D4AF37]/20" : "opacity-50")}>
      {a.earned && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/[0.04] to-transparent pointer-events-none" />
      )}
      <div
        className={cn("mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl", a.earned ? "bg-[#D4AF37]/10" : "bg-white/[0.04]")}
        style={a.earned ? { boxShadow: `0 0 20px ${a.badgeColor}30` } : {}}
      >
        {a.earned ? a.badgeIcon : <Lock className="w-5 h-5 text-white/20" />}
      </div>
      <p className={cn("text-sm font-semibold", a.earned ? "text-white" : "text-white/40")}>{a.name}</p>
      <p className="text-xs text-white/30 mt-1 leading-tight">{a.description}</p>
      {a.earned && a.earnedAt && (
        <p className="text-[10px] text-[#D4AF37]/60 mt-2">
          {new Date(a.earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      )}
    </GlassCard>
  );
}
