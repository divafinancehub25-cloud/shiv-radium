"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, DollarSign, FileText, Upload, X, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { GoldButton } from "@/components/diva/ui/gold-button";
import { GoldInput } from "@/components/diva/ui/gold-input";
import { submitDeposit } from "@/actions/diva/deposits";
import { useDepositStore } from "@/lib/diva/store/deposit-store";

export function DepositForm({ walletId, coinType, network }: { walletId: string; coinType: string; network: string }) {
  const setSubmittedDeposit = useDepositStore((s) => s.setSubmittedDeposit);
  const [amount, setAmount] = useState("");
  const [hash, setHash] = useState("");
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadProof(file: File): Promise<string | null> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/diva/deposit/proof", { method: "POST", body: form });
    if (!res.ok) return null;
    const { url } = await res.json();
    return url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let proofImageUrl: string | undefined;
    if (proofFile) {
      setUploading(true);
      const url = await uploadProof(proofFile);
      setUploading(false);
      if (!url) { setError("Failed to upload proof image"); setLoading(false); return; }
      proofImageUrl = url;
    }

    const result = await submitDeposit({
      walletId,
      amount: parseFloat(amount),
      transactionHash: hash.trim(),
      proofImageUrl,
      notes: notes || undefined,
    });

    setLoading(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    setSubmittedDeposit(result.deposit as any);
    setSuccess(true);
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <GlassCard className="p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
          <h3 className="text-white font-semibold text-lg mb-2">Deposit Submitted!</h3>
          <p className="text-white/50 text-sm mb-4">
            Your transaction is under review. You'll be notified once approved.
          </p>
          <GoldButton variant="outline" onClick={() => { setSuccess(false); setAmount(""); setHash(""); setNotes(""); setProofFile(null); }}>
            Submit Another
          </GoldButton>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <GlassCard className="p-6">
      <h3 className="text-white font-semibold text-base mb-4">Submit Transaction</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Coin + Network info */}
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
            <p className="text-white/40 text-[10px] uppercase tracking-widest">Coin</p>
            <p className="text-[#D4AF37] font-semibold text-sm mt-0.5">{coinType}</p>
          </div>
          <div className="flex-1 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
            <p className="text-white/40 text-[10px] uppercase tracking-widest">Network</p>
            <p className="text-white font-semibold text-sm mt-0.5">{network}</p>
          </div>
        </div>

        <GoldInput
          label="Amount"
          type="number"
          step="any"
          min="0"
          placeholder="0.00"
          icon={<DollarSign size={16} />}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <GoldInput
          label="Transaction Hash / TxID"
          type="text"
          placeholder="e.g. a1b2c3d4e5f6..."
          icon={<Hash size={16} />}
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          required
        />

        {/* Proof screenshot upload */}
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5">
            Proof Screenshot <span className="text-white/30">(optional)</span>
          </label>
          {proofFile ? (
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
              <span className="flex-1 text-xs text-white/70 truncate">{proofFile.name}</span>
              <button type="button" onClick={() => setProofFile(null)} className="text-white/30 hover:text-red-400">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-4 text-xs text-white/40 hover:border-[#D4AF37]/40 hover:text-white/60 transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={16} /> Upload proof of payment (JPG/PNG, max 5MB)
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setProofFile(f); }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5">Notes <span className="text-white/30">(optional)</span></label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes..."
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

        <GoldButton type="submit" loading={loading || uploading} className="w-full py-3.5">
          {uploading ? "Uploading proof…" : "Submit Deposit"}
        </GoldButton>
      </form>
    </GlassCard>
  );
}
