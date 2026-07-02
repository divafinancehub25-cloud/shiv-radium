"use client";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Wallet, Lock, Clock, AlertTriangle } from "lucide-react";
import { useWithdrawalSummary } from "@/hooks/diva/use-withdrawals";

function fmt(v: number) {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function WithdrawalBalanceCards() {
  const { data, isLoading } = useWithdrawalSummary();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <GlassCard key={i} className="h-28 animate-pulse">{null}</GlassCard>)}
      </div>
    );
  }

  const frozen = ["FROZEN", "SUSPENDED", "CLOSED"].includes(data.portfolioStatus);

  const cards = [
    { label: "Available Balance", value: fmt(data.availableBalance), icon: Wallet, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10", sub: "Withdrawable now" },
    { label: "Locked Balance", value: fmt(data.lockedBalance), icon: Lock, color: "text-blue-400", bg: "bg-blue-400/10", sub: "Reserved for pending requests" },
    { label: "Pending Requests", value: String(data.pendingCount), icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10", sub: "Awaiting review" },
  ];

  return (
    <div className="space-y-4">
      {frozen && (
        <GlassCard className="p-4 border border-red-500/20 bg-red-500/[0.04] flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">
            Your account is <span className="font-semibold">{data.portfolioStatus.toLowerCase()}</span>. Withdrawal requests are disabled.
          </p>
        </GlassCard>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg, sub }) => (
          <GlassCard key={label} className="p-5">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xs text-white/40">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{label === "Pending Requests" ? value : `$${value}`}</p>
            <p className="text-[11px] text-white/25 mt-0.5">{sub}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
