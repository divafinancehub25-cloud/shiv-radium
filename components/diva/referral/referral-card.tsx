"use client";

import { useState } from "react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Copy, Check, Share2, QrCode, Link2 } from "lucide-react";
import { toast } from "sonner";
import type { ReferralStats } from "@/types/diva/referral";

export function ReferralCard({ stats }: { stats: ReferralStats }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(stats.referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Join DIVA Growth Capital", text: "Grow your wealth with DIVA!", url: stats.referralLink });
    } else {
      copyLink();
    }
  };

  return (
    <GlassCard className="p-6 relative overflow-hidden">
      {/* Gold glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Your Referral Link</p>
          <p className="text-xl font-bold text-white font-mono tracking-widest">{stats.referralCode}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10">
          <Link2 className="w-5 h-5 text-[#D4AF37]" />
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 mb-4">
        <p className="flex-1 text-xs text-white/50 truncate">{stats.referralLink}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={copyLink}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy Link"}
        </button>
        <button
          onClick={share}
          className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.10] transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>
    </GlassCard>
  );
}
