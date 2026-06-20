"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { WalletCard } from "@/components/diva/deposit/wallet-card";
import { DepositForm } from "@/components/diva/deposit/deposit-form";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { getActiveWallets } from "@/actions/diva/wallets";
import { useDepositStore } from "@/lib/diva/store/deposit-store";

type Wallet = Awaited<ReturnType<typeof getActiveWallets>>[number];

export default function DivaDepositPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedWallet, setSelectedWallet } = useDepositStore();

  useEffect(() => {
    getActiveWallets().then((w) => { setWallets(w); if (w.length > 0 && !selectedWallet) setSelectedWallet(w[0]); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">Make a Deposit</h1>
        <p className="text-white/40 text-sm mt-1">Select a wallet, copy the address, send funds, then submit your transaction hash.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <GlassCard key={i} className="h-40 animate-pulse">{null}</GlassCard>)}
        </div>
      ) : wallets.length === 0 ? (
        <GlassCard className="p-12 text-center text-white/30 text-sm">
          No deposit wallets are currently active. Please check back later or contact support.
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: wallet selector */}
          <div className="space-y-3">
            <p className="text-white/40 text-xs uppercase tracking-widest">Step 1 — Choose wallet</p>
            <div className="space-y-3">
              {wallets.map((w, i) => (
                <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <WalletCard wallet={w} selected={selectedWallet?.id === w.id} onSelect={(w) => setSelectedWallet(w as any)} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: submit form */}
          <div className="space-y-3">
            <p className="text-white/40 text-xs uppercase tracking-widest">Step 2 — Submit transaction</p>
            {selectedWallet ? (
              <DepositForm walletId={selectedWallet.id} coinType={selectedWallet.coinType} network={selectedWallet.network} />
            ) : (
              <GlassCard className="p-8 text-center text-white/30 text-sm">Select a wallet to continue.</GlassCard>
            )}
          </div>
        </div>
      )}

      {/* Help note */}
      <GlassCard className="p-4">
        <p className="text-white/30 text-xs leading-relaxed">
          ⚠️ Always double-check the wallet address and network before sending. DIVA Growth Capital is not responsible for funds sent to incorrect addresses or on wrong networks. Deposits are reviewed within 24 hours.
        </p>
      </GlassCard>
    </div>
  );
}
