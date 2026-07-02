"use client";

import { useState, useEffect } from "react";
import { getOnboardingStatus, dismissOnboarding } from "@/actions/diva/onboarding";
import { CheckCircle, Circle, X, ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";

const stepLinks: Record<string, string> = {
  profile: "/diva-app/profile",
  kyc: "/diva-app/kyc",
  deposit: "/diva-app/deposit",
};

export function OnboardingBanner() {
  const [data, setData] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOnboardingStatus().then((res) => {
      if ("steps" in res) setData(res);
      setLoading(false);
    });
  }, []);

  const handleDismiss = async () => {
    setDismissed(true);
    await dismissOnboarding();
  };

  if (loading || dismissed || !data || data.allDone || data.profile?.onboardingCompleted) return null;

  const nextStep = data.steps.find((s: any) => !s.done && s.id !== "account");
  const pct = Math.round((data.completed / data.total) * 100);

  return (
    <div className="mb-6 rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-r from-[#D4AF37]/5 to-transparent p-5 relative">
      <button onClick={handleDismiss} className="absolute top-4 right-4 text-white/20 hover:text-white/50 transition-colors">
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4 pr-8">
        <div className="shrink-0">
          <div className="relative h-12 w-12">
            <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#D4AF37" strokeWidth="3"
                strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#D4AF37]">{pct}%</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm mb-1">Complete your profile — {data.completed}/{data.total} steps done</p>
          <p className="text-white/40 text-xs mb-4">Finish setup to unlock all STICKO features</p>

          {/* Steps */}
          <div className="flex flex-wrap gap-2 mb-4">
            {data.steps.map((s: any) => (
              <div key={s.id} className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border ${s.done ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" : "border-white/[0.08] bg-white/[0.03] text-white/40"}`}>
                {s.done
                  ? <CheckCircle className="w-3 h-3 shrink-0" />
                  : <Circle className="w-3 h-3 shrink-0" />}
                {s.label}
              </div>
            ))}
          </div>

          {nextStep && (
            <Link href={stepLinks[nextStep.id] ?? "#"} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-black text-xs font-bold hover:opacity-90 transition-opacity">
              Next: {nextStep.label} <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
