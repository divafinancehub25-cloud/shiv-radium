"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { DepositStatusBadge } from "./deposit-status-badge";
import { getUserDeposits } from "@/actions/diva/deposits";

type Deposit = Awaited<ReturnType<typeof getUserDeposits>> extends { deposits: (infer T)[] } ? T : never;

const STATUS_FILTERS = ["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"];

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function DepositHistoryTable() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getUserDeposits({ page, limit: 10, status }).then((res) => {
      if ("deposits" in res) {
        setDeposits(res.deposits as any);
        setTotal(res.total ?? 0);
        setPages(res.pages ?? 1);
      }
      setLoading(false);
    });
  }, [page, status]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={14} className="text-white/30" />
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              status === s
                ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30"
                : "bg-white/[0.03] text-white/40 border border-white/10 hover:text-white/60"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
        <span className="ml-auto text-xs text-white/30">{total} record{total !== 1 ? "s" : ""}</span>
      </div>

      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/30 text-sm">Loading…</div>
        ) : deposits.length === 0 ? (
          <div className="p-12 text-center text-white/30 text-sm">No deposits found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Coin", "Network", "Amount", "TX Hash", "Status", "Submitted", "Reviewed"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-white/30 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deposits.map((dep: any, i) => (
                  <motion.tr
                    key={dep.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 text-[#D4AF37] font-medium">{dep.coinType}</td>
                    <td className="px-4 py-3 text-white/60">{dep.network}</td>
                    <td className="px-4 py-3 text-white font-semibold">{Number(dep.amount).toFixed(4)}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-white/50 truncate block max-w-[120px]" title={dep.transactionHash}>
                        {dep.transactionHash.slice(0, 12)}…
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <DepositStatusBadge status={dep.status as any} />
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">{formatDate(dep.submittedAt)}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {dep.reviewedAt ? formatDate(dep.reviewedAt) : "—"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs text-white/40 border border-white/10 disabled:opacity-30 hover:text-white/70 transition-colors"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-xs text-white/30">Page {page} / {pages}</span>
          <button
            disabled={page === pages}
            onClick={() => setPage(page + 1)}
            className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs text-white/40 border border-white/10 disabled:opacity-30 hover:text-white/70 transition-colors"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
