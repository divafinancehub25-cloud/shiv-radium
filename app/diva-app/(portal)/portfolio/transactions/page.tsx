"use client";
import { useEffect, useState, useCallback } from "react";
import { getUserLedger } from "@/actions/diva/portfolio";
import { LedgerTable } from "@/components/diva/portfolio/ledger-table";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { DivaLedgerType } from "@prisma/client";

type Entry = {
  id: string;
  transactionType: DivaLedgerType;
  amount: any;
  previousBalance: any;
  newBalance: any;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: Date | string;
  creator?: { id: string; name: string } | null;
};

function exportCSV(entries: Entry[]) {
  const headers = ["Date", "Type", "Amount", "Previous Balance", "New Balance", "Notes"];
  const rows = entries.map((e) => [
    new Date(e.createdAt).toISOString(),
    e.transactionType,
    Number(e.amount.toString()).toFixed(2),
    Number(e.previousBalance.toString()).toFixed(2),
    Number(e.newBalance.toString()).toFixed(2),
    e.notes ?? "",
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `diva-transactions-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TransactionsPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    const res = await getUserLedger(p, 20);
    if ("entries" in res) {
      setEntries(res.entries as any);
      setTotal(res.total ?? 0);
      setPage(res.page ?? 1);
      setPages(res.pages ?? 1);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/diva-app/portfolio" className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-white/60 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Transaction History</h1>
          <p className="text-xs text-white/30">Complete immutable ledger</p>
        </div>
      </div>

      {loading && entries.length === 0 ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" /></div>
      ) : (
        <LedgerTable
          entries={entries}
          total={total}
          page={page}
          pages={pages}
          onPageChange={(p) => load(p)}
          showExport
          onExport={() => exportCSV(entries)}
        />
      )}
    </div>
  );
}
