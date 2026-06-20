"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { GoldButton } from "@/components/diva/ui/gold-button";
import { GoldInput } from "@/components/diva/ui/gold-input";
import { adminListWallets, createWallet, updateWallet, toggleWalletStatus, deleteWallet } from "@/actions/diva/wallets";

type Wallet = {
  id: string; walletName: string; coinType: string; network: string;
  address: string; qrImageUrl?: string | null; instructions?: string | null;
  status: string; sortOrder: number; _count?: { deposits: number };
  creator: { id: string; name: string; email: string };
};

const COIN_PRESETS = ["USDT", "BTC", "ETH", "BNB", "USDC"];
const NET_PRESETS: Record<string, string[]> = {
  USDT: ["TRC20", "BEP20", "ERC20"],
  BTC: ["Bitcoin"],
  ETH: ["ERC20"],
  BNB: ["BEP20"],
  USDC: ["ERC20", "TRC20"],
};

function WalletFormModal({
  wallet,
  onClose,
  onSaved,
}: {
  wallet?: Wallet | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    walletName: wallet?.walletName ?? "",
    coinType: wallet?.coinType ?? "USDT",
    network: wallet?.network ?? "TRC20",
    address: wallet?.address ?? "",
    qrImageUrl: wallet?.qrImageUrl ?? "",
    instructions: wallet?.instructions ?? "",
    sortOrder: wallet?.sortOrder ?? 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSave() {
    setLoading(true); setError("");
    const fn = wallet ? updateWallet(wallet.id, form) : createWallet(form);
    const res = await fn;
    setLoading(false);
    if ("error" in res && res.error) { setError(res.error); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg"
      >
        <GlassCard className="p-6">
          <h3 className="text-white font-semibold text-lg mb-5">{wallet ? "Edit Wallet" : "Add New Wallet"}</h3>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <GoldInput label="Wallet Name" value={form.walletName} onChange={(e) => set("walletName", e.target.value)} placeholder="e.g. USDT TRC20 Wallet" required />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/60 mb-1.5">Coin Type</label>
                <select value={form.coinType} onChange={(e) => set("coinType", e.target.value)}
                  className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2.5 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none">
                  {COIN_PRESETS.map((c) => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                  <option value="__custom__" className="bg-[#111]">Custom…</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1.5">Network</label>
                <select value={form.network} onChange={(e) => set("network", e.target.value)}
                  className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2.5 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none">
                  {(NET_PRESETS[form.coinType] ?? ["Custom"]).map((n) => <option key={n} value={n} className="bg-[#111]">{n}</option>)}
                </select>
              </div>
            </div>

            <GoldInput label="Wallet Address" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="0x… or T…" required />
            <GoldInput label="QR Code Image URL" value={form.qrImageUrl ?? ""} onChange={(e) => set("qrImageUrl", e.target.value)} placeholder="https://…" />

            <div>
              <label className="block text-xs text-white/60 mb-1.5">Deposit Instructions</label>
              <textarea value={form.instructions ?? ""} onChange={(e) => set("instructions", e.target.value)} rows={3}
                className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#D4AF37]/50 focus:outline-none resize-none"
                placeholder="e.g. Only send USDT on TRC20 network. Minimum deposit 10 USDT." />
            </div>

            <GoldInput label="Sort Order" type="number" value={String(form.sortOrder)} onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)} />

            {error && <p className="text-red-400 text-xs">{error}</p>}
          </div>

          <div className="flex gap-3 mt-5 pt-4 border-t border-white/[0.06]">
            <GoldButton variant="outline" className="flex-1" onClick={onClose}>Cancel</GoldButton>
            <GoldButton loading={loading} className="flex-1" onClick={handleSave}>
              {wallet ? "Save Changes" : "Create Wallet"}
            </GoldButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

export function WalletManagement() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; wallet: Wallet | null }>({ open: false, wallet: null });
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    const res = await adminListWallets();
    if ("wallets" in res) setWallets(res.wallets as any);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleToggle(id: string, current: string) {
    setToggling(id);
    await toggleWalletStatus(id, current === "ACTIVE" ? "INACTIVE" : "ACTIVE");
    await load();
    setToggling(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this wallet? This cannot be undone.")) return;
    setDeleting(id);
    const res = await deleteWallet(id);
    if ("error" in res && res.error) alert(res.error);
    await load();
    setDeleting(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-white/40 text-sm">{wallets.length} wallet{wallets.length !== 1 ? "s" : ""}</p>
        <GoldButton onClick={() => setModal({ open: true, wallet: null })} className="py-2 px-4 text-sm">
          <Plus size={14} className="mr-1" /> Add Wallet
        </GoldButton>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => <GlassCard key={i} className="h-20 animate-pulse">{null}</GlassCard>)}
        </div>
      ) : wallets.length === 0 ? (
        <GlassCard className="p-12 text-center text-white/30 text-sm">No wallets yet. Add your first deposit wallet.</GlassCard>
      ) : (
        <div className="space-y-3">
          {wallets.map((w, i) => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-4">
                <div className="flex items-center gap-4">
                  {/* Status dot */}
                  <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${w.status === "ACTIVE" ? "bg-emerald-400" : "bg-white/20"}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-medium text-sm">{w.walletName}</p>
                      <span className="text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-full px-2 py-0.5">{w.coinType}</span>
                      <span className="text-[10px] bg-white/[0.04] text-white/40 border border-white/10 rounded-full px-2 py-0.5">{w.network}</span>
                    </div>
                    <p className="text-white/30 text-xs font-mono mt-0.5 truncate">{w.address}</p>
                    <p className="text-white/20 text-[10px] mt-0.5">{w._count?.deposits ?? 0} deposit{(w._count?.deposits ?? 0) !== 1 ? "s" : ""}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleToggle(w.id, w.status)}
                      disabled={toggling === w.id}
                      className="rounded-lg p-2 text-white/30 hover:bg-white/[0.05] hover:text-white/70 transition-colors disabled:opacity-30"
                      title={w.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    >
                      {toggling === w.id ? <Loader2 size={16} className="animate-spin" /> : w.status === "ACTIVE" ? <ToggleRight size={16} className="text-emerald-400" /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => setModal({ open: true, wallet: w })}
                      className="rounded-lg p-2 text-white/30 hover:bg-white/[0.05] hover:text-white/70 transition-colors" title="Edit">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => handleDelete(w.id)} disabled={deleting === w.id}
                      className="rounded-lg p-2 text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-30" title="Delete">
                      {deleting === w.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modal.open && (
          <WalletFormModal
            wallet={modal.wallet}
            onClose={() => setModal({ open: false, wallet: null })}
            onSaved={() => { setModal({ open: false, wallet: null }); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
