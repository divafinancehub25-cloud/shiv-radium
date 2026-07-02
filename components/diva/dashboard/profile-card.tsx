"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { StatusBadge } from "@/components/diva/ui/status-badge";
import { Shield, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";

type Props = {
  name: string;
  email: string;
  userId: string;
  accountStatus: string;
  kycStatus: string;
  referralCode?: string | null;
  createdAt: Date;
};

export function ProfileCard({ name, email, userId, accountStatus, kycStatus, referralCode, createdAt }: Props) {
  const [copied, setCopied] = useState(false);

  function copyUserId() {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const initial = name[0]?.toUpperCase() ?? "U";

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
      <GlassCard className="overflow-hidden">
        {/* Gold gradient bar */}
        <div className="h-1 bg-gradient-to-r from-[#D4AF37] via-[#F5D76E] to-[#B8962E]" />

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8962E] text-xl font-bold text-black">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-white">{name}</h3>
              <p className="truncate text-sm text-zinc-500">{email}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">User ID</span>
              <button onClick={copyUserId} className="flex items-center gap-1.5 font-mono text-xs text-zinc-400 hover:text-[#D4AF37]">
                {userId.slice(0, 12)}…
                {copied ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Account Status</span>
              <StatusBadge status={accountStatus} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-zinc-500"><Shield size={12} /> KYC Status</span>
              <StatusBadge status={kycStatus} />
            </div>
            {referralCode && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Referral Code</span>
                <span className="font-mono text-xs text-[#D4AF37]">{referralCode}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Member Since</span>
              <span className="text-zinc-400">{new Date(createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
