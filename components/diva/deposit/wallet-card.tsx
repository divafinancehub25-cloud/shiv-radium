"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Wallet = {
  id: string;
  walletName: string;
  coinType: string;
  network: string;
  address: string;
  qrImageUrl?: string | null;
  instructions?: string | null;
};

export function WalletCard({
  wallet,
  selected,
  onSelect,
}: {
  wallet: Wallet;
  selected?: boolean;
  onSelect?: (w: Wallet) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  function copy() {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <GlassCard
      hover
      className={cn(
        "p-5 cursor-pointer transition-all duration-200",
        selected && "border-[#D4AF37]/50 bg-[#D4AF37]/5"
      )}
      onClick={() => onSelect?.(wallet)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-white font-semibold">{wallet.walletName}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-full px-2 py-0.5">
              {wallet.coinType}
            </span>
            <span className="text-xs bg-white/[0.05] text-white/50 border border-white/10 rounded-full px-2 py-0.5">
              {wallet.network}
            </span>
          </div>
        </div>
        {wallet.qrImageUrl && (
          <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-white/10 bg-white p-1 flex-shrink-0">
            <Image src={wallet.qrImageUrl} alt="QR Code" fill className="object-contain" />
          </div>
        )}
      </div>

      {/* Address */}
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 flex items-center gap-2">
        <code className="flex-1 text-xs text-white/70 break-all font-mono">{wallet.address}</code>
        <button
          onClick={(e) => { e.stopPropagation(); copy(); }}
          className="flex-shrink-0 rounded-lg p-1.5 text-white/40 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-colors"
          title="Copy address"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>

      {copied && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-emerald-400 text-xs mt-2"
        >
          ✓ Address copied to clipboard
        </motion.p>
      )}

      {/* Instructions toggle */}
      {wallet.instructions && (
        <div className="mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); setShowInstructions(!showInstructions); }}
            className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            {showInstructions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showInstructions ? "Hide" : "View"} deposit instructions
          </button>
          {showInstructions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 text-xs text-amber-200/70 whitespace-pre-wrap"
            >
              {wallet.instructions}
            </motion.div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
