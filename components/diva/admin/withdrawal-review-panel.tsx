"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { GoldButton } from "@/components/diva/ui/gold-button";
import { WithdrawalStatusBadge } from "@/components/diva/withdrawal/withdrawal-status-badge";
import { WithdrawalStatusTimeline } from "@/components/diva/withdrawal/withdrawal-status-timeline";
import { reviewWithdrawal } from "@/actions/diva/withdrawals";
import { Check, X, Eye, AlertTriangle, Wallet, Lock, User as UserIcon } from "lucide-react";

function fmt(v: number | string) {
  return Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Props = {
  withdrawal: any;
  portfolio: { currentBalance: number; availableBalance: number; lockedBalance: number; status: string } | null;
  recentLedger: any[];
};

export function WithdrawalReviewPanel({ withdrawal, portfolio, recentLedger }: Props) {
  const router = useRouter();
  const [adminNotes, setAdminNotes] = useState(withdrawal.adminNotes ?? "");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isPending = ["SUBMITTED", "UNDER_REVIEW"].includes(withdrawal.status);

  async function act(action: "UNDER_REVIEW" | "APPROVED" | "REJECTED") {
    setError("");
    if (action === "REJECTED" && !adminNotes.trim()) {
      setError("Admin notes are required when rejecting.");
      return;
    }
    setLoading(action);
    const res = await reviewWithdrawal({ withdrawalId: withdrawal.id, action, adminNotes: adminNotes || undefined });
    setLoading(null);
    if (res && "error" in res && res.error) { setError(res.error); return; }
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: request + user context */}
      <div className="lg:col-span-2 space-y-6">
        {/* Request summary */}
        <GlassCard className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs text-white/30 mb-1">Withdrawal Request</p>
              <p className="text-3xl font-bold text-[#D4AF37]">${fmt(withdrawal.amount)}</p>
              <p className="text-xs text-white/40 mt-1">{withdrawal.network}</p>
            </div>
            <WithdrawalStatusBadge status={withdrawal.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <Field label="Member" value={withdrawal.user?.name ?? "—"} sub={withdrawal.user?.email} />
            <Field label="Submitted" value={new Date(withdrawal.submittedAt).toLocaleString()} />
            <div className="sm:col-span-2">
              <p className="text-[11px] uppercase tracking-wider text-white/30 mb-1">Destination Wallet</p>
              <p className="font-mono text-xs text-white/70 break-all bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.06]">{withdrawal.walletAddress}</p>
            </div>
            {withdrawal.userNotes && <Field label="User Notes" value={withdrawal.userNotes} className="sm:col-span-2" />}
            {withdrawal.reviewer && <Field label="Reviewed By" value={withdrawal.reviewer.name ?? "Admin"} />}
          </div>
        </GlassCard>

        {/* Account context */}
        {portfolio && (
          <GlassCard className="p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Account & Balance Review</h3>
            {portfolio.status !== "ACTIVE" && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5" /> Account status: {portfolio.status}
              </div>
            )}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <MiniStat icon={Wallet} label="Current" value={`$${fmt(portfolio.currentBalance)}`} color="text-white" />
              <MiniStat icon={UserIcon} label="Available" value={`$${fmt(portfolio.availableBalance)}`} color="text-[#D4AF37]" />
              <MiniStat icon={Lock} label="Locked" value={`$${fmt(portfolio.lockedBalance)}`} color="text-blue-400" />
            </div>
            <p className="text-[11px] uppercase tracking-wider text-white/30 mb-2">Recent Ledger Activity</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {recentLedger.length === 0 ? (
                <p className="text-white/30 text-xs">No ledger activity.</p>
              ) : recentLedger.map((l) => (
                <div key={l.id} className="flex items-center justify-between text-xs py-1 border-b border-white/[0.03] last:border-0">
                  <span className="text-white/40">{l.transactionType}</span>
                  <span className={Number(l.amount) < 0 ? "text-red-400" : "text-emerald-400"}>
                    {Number(l.amount) < 0 ? "" : "+"}{fmt(l.amount)}
                  </span>
                  <span className="text-white/20">{new Date(l.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>

      {/* Right: actions + timeline */}
      <div className="space-y-6">
        <GlassCard className="p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Review Actions</h3>

          {isPending ? (
            <>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Admin Notes <span className="text-white/30">(required to reject)</span>
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder="Add review notes..."
                className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#D4AF37]/50 focus:outline-none resize-none mb-4"
              />

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <GoldButton onClick={() => act("APPROVED")} loading={loading === "APPROVED"} className="w-full">
                  <Check className="w-4 h-4" /> Approve & Settle
                </GoldButton>
                <button onClick={() => act("REJECTED")} disabled={!!loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/40 text-red-400 py-2.5 text-sm font-semibold hover:bg-red-500/10 disabled:opacity-50">
                  <X className="w-4 h-4" /> Reject & Release
                </button>
                {withdrawal.status === "SUBMITTED" && (
                  <button onClick={() => act("UNDER_REVIEW")} disabled={!!loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 text-white/60 py-2.5 text-sm hover:bg-white/[0.05] disabled:opacity-50">
                    <Eye className="w-4 h-4" /> Mark Under Review
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <WithdrawalStatusBadge status={withdrawal.status} />
              <p className="text-white/30 text-xs mt-3">This request has been finalized.</p>
              {withdrawal.adminNotes && <p className="text-white/50 text-xs mt-2 italic">"{withdrawal.adminNotes}"</p>}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Status Timeline</h3>
          <WithdrawalStatusTimeline history={withdrawal.statusHistory ?? []} />
        </GlassCard>
      </div>
    </div>
  );
}

function Field({ label, value, sub, className }: { label: string; value: string; sub?: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[11px] uppercase tracking-wider text-white/30 mb-0.5">{label}</p>
      <p className="text-white/80">{value}</p>
      {sub && <p className="text-white/30 text-xs">{sub}</p>}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
      <Icon className="w-3.5 h-3.5 text-white/30 mb-1.5" />
      <p className="text-[10px] text-white/30">{label}</p>
      <p className={`text-sm font-semibold ${color}`}>{value}</p>
    </div>
  );
}
