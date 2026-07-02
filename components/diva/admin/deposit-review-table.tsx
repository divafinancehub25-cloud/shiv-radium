"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Eye, ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { GoldButton } from "@/components/diva/ui/gold-button";
import { DepositStatusBadge } from "@/components/diva/deposit/deposit-status-badge";
import { adminListDeposits, reviewDeposit } from "@/actions/diva/deposits";
import Image from "next/image";

type Deposit = any;

const STATUS_FILTERS = ["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"];

function DepositDetailModal({ deposit, onClose, onReviewed }: { deposit: Deposit; onClose: () => void; onReviewed: () => void }) {
  const [action, setAction] = useState<"UNDER_REVIEW" | "APPROVED" | "REJECTED" | null>(null);
  const [adminNotes, setAdminNotes] = useState(deposit.adminNotes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleReview() {
    if (!action) return;
    setLoading(true); setError("");
    const res = await reviewDeposit({ depositId: deposit.id, action, adminNotes: adminNotes || undefined });
    setLoading(false);
    if ("error" in res && res.error) { setError(res.error); return; }
    onReviewed();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <GlassCard className="p-6">
          <div className="flex items-start justify-between mb-5">
            <h3 className="text-white font-semibold text-lg">Deposit Review</h3>
            <DepositStatusBadge status={deposit.status} />
          </div>

          {/* User info */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: "Member", value: deposit.user?.name ?? "—" },
              { label: "Email", value: deposit.user?.email ?? "—" },
              { label: "Coin", value: deposit.coinType },
              { label: "Network", value: deposit.network },
              { label: "Amount", value: `${Number(deposit.amount).toFixed(8)} ${deposit.coinType}` },
              { label: "Wallet Used", value: deposit.wallet?.walletName ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
                <p className="text-white/30 text-[10px] uppercase tracking-wider">{label}</p>
                <p className="text-white text-sm mt-0.5 truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* TX Hash */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 mb-4">
            <p className="text-white/30 text-[10px] uppercase tracking-wider mb-0.5">Transaction Hash</p>
            <code className="text-white/80 text-xs font-mono break-all">{deposit.transactionHash}</code>
          </div>

          {/* Proof image */}
          {deposit.proofImageUrl && (
            <div className="mb-4">
              <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">Proof Screenshot</p>
              <a href={deposit.proofImageUrl} target="_blank" rel="noopener noreferrer"
                className="block rounded-xl overflow-hidden border border-white/[0.06] hover:border-[#D4AF37]/30 transition-colors">
                <div className="relative h-48 bg-white/[0.02]">
                  <Image src={deposit.proofImageUrl} alt="Proof" fill className="object-contain" />
                </div>
              </a>
            </div>
          )}

          {/* Notes */}
          {deposit.notes && (
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 mb-4">
              <p className="text-white/30 text-[10px] uppercase tracking-wider mb-0.5">User Notes</p>
              <p className="text-white/70 text-sm">{deposit.notes}</p>
            </div>
          )}

          {/* Review actions (only for non-final statuses) */}
          {deposit.status !== "APPROVED" && deposit.status !== "REJECTED" && (
            <div className="border-t border-white/[0.06] pt-4 space-y-3">
              <div className="flex gap-2">
                {(["UNDER_REVIEW", "APPROVED", "REJECTED"] as const).map((a) => (
                  <button key={a} onClick={() => setAction(a)}
                    className={`flex-1 rounded-xl py-2 text-xs font-medium border transition-all ${
                      action === a
                        ? a === "APPROVED" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                          : a === "REJECTED" ? "bg-red-500/20 border-red-500/40 text-red-400"
                          : "bg-blue-500/20 border-blue-500/40 text-blue-400"
                        : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/70"
                    }`}
                  >
                    {a.replace("_", " ")}
                  </button>
                ))}
              </div>

              {action && (
                <div>
                  <label className="block text-xs text-white/60 mb-1.5">
                    Admin Notes {action === "REJECTED" && <span className="text-red-400">*</span>}
                  </label>
                  <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2}
                    className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#D4AF37]/50 focus:outline-none resize-none"
                    placeholder={action === "REJECTED" ? "Reason for rejection (required)" : "Optional notes for your records…"} />
                </div>
              )}

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <div className="flex gap-3">
                <GoldButton variant="outline" className="flex-1" onClick={onClose}>Cancel</GoldButton>
                {action && (
                  <GoldButton loading={loading} className="flex-1" onClick={handleReview}>
                    Confirm: {action.replace("_", " ")}
                  </GoldButton>
                )}
              </div>
            </div>
          )}

          {(deposit.status === "APPROVED" || deposit.status === "REJECTED") && (
            <div className="border-t border-white/[0.06] pt-4">
              {deposit.adminNotes && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 mb-3">
                  <p className="text-white/30 text-[10px] uppercase tracking-wider mb-0.5">Admin Notes</p>
                  <p className="text-white/70 text-sm">{deposit.adminNotes}</p>
                </div>
              )}
              <GoldButton variant="outline" className="w-full" onClick={onClose}>Close</GoldButton>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}

export function DepositReviewTable() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Deposit | null>(null);

  async function load() {
    setLoading(true);
    const res = await adminListDeposits({ page, limit: 20, status, search });
    if ("deposits" in res) {
      setDeposits(res.deposits as any);
      setTotal(res.total ?? 0);
      setPages(res.pages ?? 1);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [page, status, search]);

  function formatDate(d: any) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search email or TX hash…"
            className="w-full rounded-xl bg-white/[0.05] border border-white/10 pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#D4AF37]/50 focus:outline-none" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
                status === s ? "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30" : "bg-white/[0.03] text-white/40 border-white/10 hover:text-white/70"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-white/30">{total} deposit{total !== 1 ? "s" : ""}</div>

      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 size={20} className="animate-spin text-[#D4AF37] mx-auto" /></div>
        ) : deposits.length === 0 ? (
          <div className="p-12 text-center text-white/30 text-sm">No deposits found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Member", "Coin / Network", "Amount", "TX Hash", "Status", "Submitted", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deposits.map((dep, i) => (
                  <motion.tr key={dep.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{dep.user?.name}</p>
                      <p className="text-white/30 text-xs">{dep.user?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#D4AF37] font-medium">{dep.coinType}</p>
                      <p className="text-white/40 text-xs">{dep.network}</p>
                    </td>
                    <td className="px-4 py-3 text-white font-semibold">{Number(dep.amount).toFixed(4)}</td>
                    <td className="px-4 py-3">
                      <code className="text-white/50 text-xs font-mono">{dep.transactionHash.slice(0, 14)}…</code>
                    </td>
                    <td className="px-4 py-3"><DepositStatusBadge status={dep.status} /></td>
                    <td className="px-4 py-3 text-white/40 text-xs">{formatDate(dep.submittedAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(dep)}
                        className="rounded-lg p-1.5 text-white/30 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-colors">
                        <Eye size={15} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}
            className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs text-white/40 border border-white/10 disabled:opacity-30 hover:text-white/70">
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-xs text-white/30">Page {page} / {pages}</span>
          <button disabled={page === pages} onClick={() => setPage(page + 1)}
            className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs text-white/40 border border-white/10 disabled:opacity-30 hover:text-white/70">
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {selected && (
        <DepositDetailModal
          deposit={selected}
          onClose={() => setSelected(null)}
          onReviewed={() => { setSelected(null); load(); }}
        />
      )}
    </div>
  );
}
