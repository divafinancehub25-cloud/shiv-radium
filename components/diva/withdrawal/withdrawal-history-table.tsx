"use client";
import { useState } from "react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { WithdrawalStatusBadge } from "./withdrawal-status-badge";
import { WithdrawalStatusTimeline } from "./withdrawal-status-timeline";
import { useUserWithdrawals, useCancelWithdrawal } from "@/hooks/diva/use-withdrawals";
import { useWithdrawalStore } from "@/lib/diva/store/withdrawal-store";
import { getWithdrawalDetail } from "@/actions/diva/withdrawals";
import { Search, Download, ChevronLeft, ChevronRight, X, Loader2, Ban } from "lucide-react";
import type { WithdrawalStatusHistoryRow } from "@/types/diva/withdrawal";

const STATUSES = ["ALL", "SUBMITTED", "UNDER_REVIEW", "COMPLETED", "REJECTED", "CANCELLED"];

function maskAddr(a: string) {
  return a.length <= 12 ? a : `${a.slice(0, 6)}…${a.slice(-4)}`;
}
function fmt(v: number | string) {
  return Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function WithdrawalHistoryTable() {
  const { statusFilter, search, page, setStatusFilter, setSearch, setPage } = useWithdrawalStore();
  const [searchInput, setSearchInput] = useState(search);
  const { data, isLoading } = useUserWithdrawals(page, statusFilter, search);
  const cancelMut = useCancelWithdrawal();

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailHistory, setDetailHistory] = useState<WithdrawalStatusHistoryRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const withdrawals = data?.withdrawals ?? [];
  const pages = data?.pages ?? 1;

  async function openDetail(id: string) {
    setDetailId(id);
    setDetailLoading(true);
    const res = await getWithdrawalDetail(id);
    if (!("error" in res)) setDetailHistory(res.withdrawal.statusHistory as any);
    setDetailLoading(false);
  }

  function exportCSV() {
    const header = "Request ID,Amount,Wallet Address,Network,Status,Submitted,Processed\n";
    const rows = withdrawals.map((w: any) =>
      [w.id, fmt(w.amount), w.walletAddress, w.network, w.status,
       new Date(w.submittedAt).toISOString(),
       w.completedAt ? new Date(w.completedAt).toISOString() : w.reviewedAt ? new Date(w.reviewedAt).toISOString() : ""].join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `withdrawals-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] flex-wrap">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-[#D4AF37] text-black" : "text-white/40 hover:text-white/70"}`}>
              {s === "ALL" ? "All" : s.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search address / ID"
              className="pl-9 pr-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-xs w-44 focus:outline-none focus:border-[#D4AF37]/40" />
          </form>
          <button onClick={exportCSV} disabled={!withdrawals.length}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/60 text-xs hover:text-white disabled:opacity-40">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <GlassCard className="overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex justify-center"><Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" /></div>
        ) : withdrawals.length === 0 ? (
          <div className="p-16 text-center text-white/30 text-sm">No withdrawal requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-wider text-white/30">
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Address</th>
                  <th className="px-4 py-3 font-medium">Network</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w: any) => (
                  <tr key={w.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#D4AF37]">${fmt(w.amount)}</td>
                    <td className="px-4 py-3 font-mono text-white/50 text-xs">{maskAddr(w.walletAddress)}</td>
                    <td className="px-4 py-3 text-white/60 text-xs">{w.network}</td>
                    <td className="px-4 py-3"><WithdrawalStatusBadge status={w.status} /></td>
                    <td className="px-4 py-3 text-white/40 text-xs">{new Date(w.submittedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openDetail(w.id)} className="text-xs text-white/50 hover:text-[#D4AF37]">View</button>
                        {["SUBMITTED", "UNDER_REVIEW"].includes(w.status) && (
                          <button onClick={() => cancelMut.mutate(w.id)} disabled={cancelMut.isPending}
                            className="flex items-center gap-1 text-xs text-red-400/70 hover:text-red-400 disabled:opacity-40">
                            <Ban className="w-3 h-3" /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
            className="p-1.5 rounded-lg bg-white/[0.05] text-white/50 disabled:opacity-30 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-xs text-white/40">Page {page} of {pages}</span>
          <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page >= pages}
            className="p-1.5 rounded-lg bg-white/[0.05] text-white/50 disabled:opacity-30 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}

      {/* Detail drawer */}
      {detailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setDetailId(null)}>
          <GlassCard className="p-6 max-w-md w-full bg-[#0E0E0E]" >
            <div onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Status Timeline</h3>
                <button onClick={() => setDetailId(null)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              {detailLoading ? (
                <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" /></div>
              ) : (
                <WithdrawalStatusTimeline history={detailHistory} />
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
