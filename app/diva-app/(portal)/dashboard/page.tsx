"use client";

import { useSession } from "next-auth/react";
import { StatsCard } from "@/components/diva/dashboard/stats-card";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { TrendingUp, Users, Shield, Wallet } from "lucide-react";

export default function DivaDashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Welcome back, {session?.user?.name ?? "Investor"}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Portfolio Value" value="$0.00" icon={Wallet} delay={0} />
        <StatsCard title="Active Investments" value="0" icon={TrendingUp} delay={0.1} />
        <StatsCard title="Referrals" value="0" icon={Users} delay={0.2} />
        <StatsCard title="KYC Status" value="Pending" icon={Shield} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlassCard className="p-6 h-40 flex items-center justify-center">
            <p className="text-white/30 text-sm">Investment activity coming soon</p>
          </GlassCard>
        </div>
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8962E] flex items-center justify-center text-black font-bold text-lg">
              {session?.user?.name?.[0]?.toUpperCase() ?? "D"}
            </div>
            <div>
              <p className="text-white font-medium">{session?.user?.name ?? "Member"}</p>
              <p className="text-white/40 text-xs">{session?.user?.email}</p>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Account Status</span>
              <span className="text-emerald-400">Active</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">KYC</span>
              <span className="text-amber-400">Pending</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
