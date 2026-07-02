"use client";

import { useState, useEffect } from "react";
import { getAuditLogs } from "@/actions/diva/analytics";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Search, Filter } from "lucide-react";

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = (p = 1) => {
    setLoading(true);
    getAuditLogs({ from: from || undefined, to: to || undefined, action: action || undefined, page: p }).then((res) => {
      if ("data" in res) {
        setLogs(res.data ?? []);
        setTotal(res.total ?? 0);
        setPages(res.pages ?? 1);
        setPage(res.page ?? 1);
      }
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(1); };

  const exportCsv = () => {
    const headers = ["ID", "Action", "Entity", "Actor", "IP", "Date"];
    const rows = logs.map((l) => [l.id, l.action, l.entityType, l.actorEmail ?? "", l.ipAddress ?? "", l.createdAt]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit-logs.csv"; a.click();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-sm text-white/40 mt-1">All admin and system actions — {total} total records</p>
        </div>
        <button onClick={exportCsv} className="px-4 py-2 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-medium hover:bg-[#D4AF37]/25 transition-colors">
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch}>
        <GlassCard className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-[10px] text-white/30 block mb-1">From Date</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#D4AF37]/50" />
            </div>
            <div>
              <label className="text-[10px] text-white/30 block mb-1">To Date</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#D4AF37]/50" />
            </div>
            <div>
              <label className="text-[10px] text-white/30 block mb-1">Action</label>
              <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. KYC_REVIEWED" className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#D4AF37]/50 w-40" />
            </div>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-black text-xs font-semibold hover:opacity-90">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
          </div>
        </GlassCard>
      </form>

      {/* Table */}
      <GlassCard className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-white/30 text-sm py-12">No audit logs found</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left pb-3 text-white/30 font-medium">Action</th>
                    <th className="text-left pb-3 text-white/30 font-medium">Entity</th>
                    <th className="text-left pb-3 text-white/30 font-medium hidden sm:table-cell">Actor</th>
                    <th className="text-left pb-3 text-white/30 font-medium hidden md:table-cell">IP</th>
                    <th className="text-left pb-3 text-white/30 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {logs.map((l) => (
                    <tr key={l.id}>
                      <td className="py-2.5 pr-4"><span className="text-[#D4AF37] font-mono">{l.action}</span></td>
                      <td className="py-2.5 pr-4 text-white/60">{l.entityType}{l.entityId ? ` #${l.entityId.slice(0, 8)}` : ""}</td>
                      <td className="py-2.5 pr-4 hidden sm:table-cell">
                        <p className="text-white">{l.actorName ?? "System"}</p>
                        <p className="text-white/30">{l.actorEmail}</p>
                      </td>
                      <td className="py-2.5 pr-4 text-white/30 hidden md:table-cell">{l.ipAddress ?? "—"}</td>
                      <td className="py-2.5 text-white/40">{fmtDate(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-white/30">Page {page} of {pages}</p>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => load(page - 1)} className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.04] text-white/40 disabled:opacity-30 hover:bg-white/[0.08]">Prev</button>
                  <button disabled={page >= pages} onClick={() => load(page + 1)} className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.04] text-white/40 disabled:opacity-30 hover:bg-white/[0.08]">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </GlassCard>
    </div>
  );
}
