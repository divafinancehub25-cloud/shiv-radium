"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Wallet, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { GoldButton } from "@/components/diva/ui/gold-button";
import { GoldInput } from "@/components/diva/ui/gold-input";
import { useWithdrawalStore } from "@/lib/diva/store/withdrawal-store";
import { useWithdrawalSummary, useCreateWithdrawal } from "@/hooks/diva/use-withdrawals";
import { WITHDRAWAL_NETWORKS } from "@/types/diva/withdrawal";
import type { WithdrawalNetwork } from "@/types/diva/withdrawal";

function fmt(v: number) {
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function WithdrawalForm() {
  const { amount, walletAddress, network, userNotes, setField, resetForm } = useWithdrawalStore();
  const { data: summary } = useWithdrawalSummary();
  const createMut = useCreateWithdrawal();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const available = summary?.availableBalance ?? 0;
  const frozen = summary ? ["FROZEN", "SUSPENDED", "CLOSED"].includes(summary.portfolioStatus) : false;
  const amountNum = parseFloat(amount) || 0;
  const exceeds = amountNum > available;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (frozen) { setError("Withdrawals are disabled for your account status."); return; }
    if (amountNum <= 0) { setError("Enter a valid amount."); return; }
    if (exceeds) { setError("Amount exceeds your available balance."); return; }

    const res = await createMut.mutateAsync({
      amount: amountNum,
      walletAddress: walletAddress.trim(),
      network,
      userNotes: userNotes || undefined,
    });

    if (res && "error" in res && res.error) { setError(res.error); return; }
    setSuccess(true);
    resetForm();
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <GlassCard className="p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
          <h3 className="text-white font-semibold text-lg mb-2">Withdrawal Submitted!</h3>
          <p className="text-white/50 text-sm mb-4">
            Your request is under review and the funds are now locked. You'll be notified once it's processed.
          </p>
          <GoldButton variant="outline" onClick={() => setSuccess(false)}>Submit Another</GoldButton>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <GlassCard className="p-6">
      <h3 className="text-white font-semibold text-base mb-4">Request Withdrawal</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <GoldInput
            label="Amount (USDT)"
            type="number"
            step="any"
            min="0"
            placeholder="0.00"
            icon={<DollarSign size={16} />}
            value={amount}
            onChange={(e) => setField({ amount: e.target.value })}
            error={exceeds ? "Exceeds available balance" : undefined}
            required
          />
          <div className="flex justify-between mt-1.5 text-[11px]">
            <span className="text-white/30">Available: <span className="text-[#D4AF37]">${fmt(available)}</span></span>
            <button type="button" onClick={() => setField({ amount: String(available) })}
              className="text-[#D4AF37] hover:underline">Max</button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5 block">Network</label>
          <select
            value={network}
            onChange={(e) => setField({ network: e.target.value as WithdrawalNetwork })}
            className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
          >
            {WITHDRAWAL_NETWORKS.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
          </select>
        </div>

        <GoldInput
          label="Destination Wallet Address"
          type="text"
          placeholder="Paste your wallet address"
          icon={<Wallet size={16} />}
          value={walletAddress}
          onChange={(e) => setField({ walletAddress: e.target.value })}
          required
        />

        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5">Notes <span className="text-white/30">(optional)</span></label>
          <textarea
            value={userNotes}
            onChange={(e) => setField({ userNotes: e.target.value })}
            placeholder="Any additional notes for the reviewer..."
            rows={2}
            className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#D4AF37]/50 focus:outline-none resize-none"
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <GoldButton type="submit" loading={createMut.isPending} disabled={frozen} className="w-full py-3.5">
          {frozen ? "Withdrawals Disabled" : "Submit Withdrawal Request"}
        </GoldButton>
      </form>
    </GlassCard>
  );
}
