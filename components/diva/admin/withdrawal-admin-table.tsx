"use client";
import { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { WithdrawalStatusBadge } from "@/components/diva/withdrawal/withdrawal-status-badge";
import { useAdminWithdrawals } from "@/hooks/diva/use-withdrawals";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const STATUSES = ["ALL", "SUBMITTED", "UNDER_REVIEW", "COMPLETED", "REJECTED", "CANCELLED"];

function maskAddr(a: string) {
  return a.length <= 12 ? a : `${a.slice(0, 6)}…${a.slice(-4)}`;
}
function fmt(v: number | string) {
  return Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function WithdrawalAdminTable() {
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminWithdrawals(page, status, search);

  const withdrawals = data?.withdrawals ?? [];
  const pages = data?.pages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] flex-wrap">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${status === s ? "bg-[#D4AF37] text-black" : "text-white/40 hover:text-white/70"}`}>
              {s === "ALL" ? "All" : s.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search member / address"
            className="pl-9 pr-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-xs w-56 focus:outline-none focus:border-[#D4AF37]/40" />
        </form>
      </div>

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
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Address</th>
                  <th className="px-4 py-3 font-medium">Network</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium text-right">Review</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w: any) => (
                  <tr key={w.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white/80 text-xs font-medium">{w.user?.name ?? "—"}</p>
                      <p className="text-white/30 text-[11px]">{w.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#D4AF37]">${fmt(w.amount)}</td>
                    <td className="px-4 py-3 font-mono text-white/50 text-xs">{maskAddr(w.walletAddress)}</td>
                    <td className="px-4 py-3 text-white/60 text-xs">{w.network}</td>
                    <td className="px-4 py-3"><WithdrawalStatusBadge status={w.status} /></td>
                    <td className="px-4 py-3 text-white/40 text-xs">{new Date(w.submittedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/diva-app-admin/withdrawals/${w.id}`} className="text-xs text-[#D4AF37] hover:underline">Review →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
            className="p-1.5 rounded-lg bg-white/[0.05] text-white/50 disabled:opacity-30 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-xs text-white/40">Page {page} of {pages}</span>
          <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page >= pages}
            className="p-1.5 rounded-lg bg-white/[0.05] text-white/50 disabled:opacity-30 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}
