"use client";

import { GlassCard } from "@/components/diva/ui/glass-card";
import { Users, UserCheck, Clock, Star } from "lucide-react";
import type { ReferralStats } from "@/types/diva/referral";

const stats = (s: ReferralStats) => [
  { label: "Total Referrals", value: s.totalReferrals, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
  { label: "Activated", value: s.successfulReferrals, icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { label: "Pending", value: s.pendingReferrals, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { label: "Points Earned", value: s.pointsEarned.toFixed(0), icon: Star, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
];

export function ReferralStats({ data }: { data: ReferralStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats(data).map((s) => (
        <GlassCard key={s.label} className="p-4">
          <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}>
            <s.icon className={`h-4 w-4 ${s.color}`} />
          </div>
          <p className="text-2xl font-bold text-white">{s.value}</p>
          <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
        </GlassCard>
      ))}
    </div>
  );
}
