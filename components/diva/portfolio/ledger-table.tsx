"use client";
import { useState, useTransition } from "react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, ChevronLeft, ChevronRight, Download } from "lucide-react";
import type { DivaLedgerType } from "@prisma/client";

type Entry = {
  id: string;
  transactionType: DivaLedgerType;
  amount: string | number | { toString(): string };
  previousBalance: string | number | { toString(): string };
  newBalance: string | number | { toString(): string };
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: Date | string;
  creator?: { id: string; name: string } | null;
};

type Props = {
  entries: Entry[];
  total: number;
  page: number;
  pages: number;
  onPageChange: (p: number) => void;
  showExport?: boolean;
  onExport?: () => void;
};

const typeConfig: Record<DivaLedgerType, { label: string; color: string; icon: "up" | "down" }> = {
  DEPOSIT_CREDIT: { label: "Deposit Credit", color: "text-emerald-400", icon: "up" },
  ADMIN_CREDIT: { label: "Admin Credit", color: "text-blue-400", icon: "up" },
  ADMIN_DEBIT: { label: "Admin Debit", color: "text-red-400", icon: "down" },
  BALANCE_CORRECTION: { label: "Correction", color: "text-yellow-400", icon: "up" },
  SYSTEM_ADJUSTMENT: { label: "System Adj.", color: "text-purple-400", icon: "up" },
};

function fmt(v: string | number | { toString(): string }) {
  return Number(v.toString()).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(v: Date | string) {
  return new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function LedgerTable({ entries, total, page, pages, onPageChange, showExport, onExport }: Props) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div>
          <h3 className="text-sm font-semibold text-white">Transaction Ledger</h3>
          <p className="text-xs text-white/30 mt-0.5">{total} total entries</p>
        </div>
        {showExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white/60 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="py-16 text-center text-white/20 text-sm">No transactions yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/30 text-xs border-b border-white/[0.04]">
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Prev. Balance</th>
                <th className="px-4 py-3 font-medium">New Balance</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {entries.map((e) => {
                const cfg = typeConfig[e.transactionType] ?? { label: e.transactionType, color: "text-white/60", icon: "up" };
                const isDebit = e.transactionType === "ADMIN_DEBIT";
                return (
                  <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full bg-white/[0.05] flex items-center justify-center ${cfg.color}`}>
                          {cfg.icon === "up" ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                        </div>
                        <span className={`font-medium ${cfg.color}`}>{cfg.label}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 font-mono font-semibold ${isDebit ? "text-red-400" : "text-emerald-400"}`}>
                      {isDebit ? "-" : "+"}${fmt(e.amount)}
                    </td>
                    <td className="px-4 py-3 text-white/50 font-mono">${fmt(e.previousBalance)}</td>
                    <td className="px-4 py-3 text-white font-mono font-medium">${fmt(e.newBalance)}</td>
                    <td className="px-4 py-3 text-white/40 max-w-[200px] truncate">{e.notes ?? "—"}</td>
                    <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">{fmtDate(e.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.06]">
          <span className="text-xs text-white/30">Page {page} of {pages}</span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-30 flex items-center justify-center text-white/60 hover:text-white transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={page >= pages}
              onClick={() => onPageChange(page + 1)}
              className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-30 flex items-center justify-center text-white/60 hover:text-white transition-all"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
