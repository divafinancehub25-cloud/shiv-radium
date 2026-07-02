"use client";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { TrendingUp, Lock, Wallet, Activity } from "lucide-react";
import type { DivaPortfolioStatus } from "@prisma/client";

type Props = {
  currentBalance: string;
  availableBalance: string;
  lockedBalance: string;
  status: DivaPortfolioStatus;
};

const statusConfig: Record<DivaPortfolioStatus, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: "Active", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  SUSPENDED: { label: "Suspended", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  FROZEN: { label: "Frozen", color: "text-blue-400", bg: "bg-blue-400/10" },
  CLOSED: { label: "Closed", color: "text-red-400", bg: "bg-red-400/10" },
};

function fmt(val: string) {
  return Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PortfolioBalanceCard({ currentBalance, availableBalance, lockedBalance, status }: Props) {
  const cfg = statusConfig[status];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Main balance */}
      <GlassCard className="md:col-span-3 p-6 border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/[0.05] to-transparent">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/40 mb-1">Total Portfolio Value</p>
            <p className="text-4xl font-bold text-white tracking-tight">
              ${fmt(currentBalance)}
            </p>
            <div className={`inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {cfg.label}
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8962E] flex items-center justify-center">
            <Wallet className="w-7 h-7 text-black" />
          </div>
        </div>
      </GlassCard>

      {/* Available */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-400/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-sm text-white/40">Available Balance</span>
        </div>
        <p className="text-2xl font-semibold text-white">${fmt(availableBalance)}</p>
      </GlassCard>

      {/* Locked */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-yellow-400/10 flex items-center justify-center">
            <Lock className="w-4 h-4 text-yellow-400" />
          </div>
          <span className="text-sm text-white/40">Locked Balance</span>
        </div>
        <p className="text-2xl font-semibold text-white">${fmt(lockedBalance)}</p>
      </GlassCard>

      {/* Net */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <span className="text-sm text-white/40">Net Liquid</span>
        </div>
        <p className="text-2xl font-semibold text-white">
          ${fmt((Number(availableBalance) - Number(lockedBalance)).toString())}
        </p>
      </GlassCard>
    </div>
  );
}
