"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { StatsCard } from "@/components/diva/dashboard/stats-card";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { TrendingUp, Users, Shield, Wallet } from "lucide-react";
import { OnboardingBanner } from "@/components/diva/onboarding/onboarding-banner";
import { getUserPortfolio } from "@/actions/diva/portfolio";
import { getMyProfile } from "@/actions/diva/profile";

function money(v: number) {
  return "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DivaDashboardPage() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number | null>(null);
  const [available, setAvailable] = useState<number>(0);
  const [kyc, setKyc] = useState<string>("NONE");
  const [status, setStatus] = useState<string>("ACTIVE");
  const [referrals, setReferrals] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const [p, prof] = await Promise.all([getUserPortfolio(), getMyProfile()]);
      if (p && "portfolio" in p && p.portfolio) {
        setBalance(Number(p.portfolio.currentBalance ?? 0));
        setAvailable(Number(p.portfolio.availableBalance ?? 0));
        setStatus(String(p.portfolio.status ?? "ACTIVE"));
      } else {
        setBalance(0);
      }
      if (prof) {
        setKyc((prof as any).divaKYC?.status ?? "NONE");
        const rc = (prof as any).divaProfile?.referralCount;
        if (typeof rc === "number") setReferrals(rc);
      }
    })().catch(() => setBalance(0));
  }, []);

  const kycLabel =
    kyc === "APPROVED" ? "Verified" : kyc === "UNDER_REVIEW" ? "In Review" : kyc === "REJECTED" ? "Rejected" : kyc === "PENDING" ? "Pending" : "Not Started";
  const kycColor = kyc === "APPROVED" ? "text-emerald-400" : kyc === "REJECTED" ? "text-red-400" : "text-amber-400";

  return (
    <div className="space-y-6">
      <OnboardingBanner />
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Welcome back, {session?.user?.name ?? "Investor"}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Portfolio Value" value={balance === null ? "…" : money(balance)} icon={Wallet} delay={0} />
        <StatsCard title="Available Balance" value={balance === null ? "…" : money(available)} icon={TrendingUp} delay={0.1} />
        <StatsCard title="Referrals" value={String(referrals)} icon={Users} delay={0.2} />
        <StatsCard title="KYC Status" value={kycLabel} icon={Shield} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlassCard className="p-6 h-40 flex flex-col items-center justify-center">
            <p className="text-white/40 text-sm">Current Balance</p>
            <p className="text-3xl font-bold text-white mt-2">{balance === null ? "…" : money(balance)}</p>
            <p className="text-white/30 text-xs mt-1">Available: {money(available)}</p>
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
              <span className="text-emerald-400">{status}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">KYC</span>
              <span className={kycColor}>{kycLabel}</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
