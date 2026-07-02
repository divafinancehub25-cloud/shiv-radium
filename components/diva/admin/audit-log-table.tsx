"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { adminAuditLogs } from "@/actions/diva/deposits";

const ACTION_COLORS: Record<string, string> = {
  WALLET_CREATED:      "text-emerald-400 bg-emerald-500/10",
  WALLET_UPDATED:      "text-blue-400 bg-blue-500/10",
  WALLET_DELETED:      "text-red-400 bg-red-500/10",
  WALLET_ACTIVATED:    "text-emerald-400 bg-emerald-500/10",
  WALLET_DEACTIVATED:  "text-amber-400 bg-amber-500/10",
  DEPOSIT_SUBMITTED:   "text-[#D4AF37] bg-[#D4AF37]/10",
  DEPOSIT_UNDER_REVIEW:"text-blue-400 bg-blue-500/10",
  DEPOSIT_APPROVED:    "text-emerald-400 bg-emerald-500/10",
  DEPOSIT_REJECTED:    "text-red-400 bg-red-500/10",
};

export function AuditLogTable() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminAuditLogs({ page, limit: 30 }).then((res) => {
      if ("logs" in res) { setLogs(res.logs as any); setTotal(res.total ?? 0); setPages(res.pages ?? 1); }
      setLoading(false);
    });
  }, [page]);

  function formatDate(d: any) {
    return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-4">
      <p className="text-white/30 text-sm">{total} audit event{total !== 1 ? "s" : ""}</p>

      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/30 text-sm">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-white/30 text-sm">No audit events yet.</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {logs.map((log, i) => (
              <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="flex items-start gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <Shield size={14} className="mt-0.5 text-white/20 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[log.action] ?? "text-white/50 bg-white/5"}`}>
                      {log.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-white/40 text-xs">{log.entityType}</span>
                    {log.entityId && <span className="text-white/20 text-xs font-mono">{log.entityId.slice(0, 8)}…</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {log.actor && (
                      <span className="text-white/50 text-xs">{log.actor.name ?? log.actor.email}</span>
                    )}
                    {log.ipAddress && (
                      <span className="text-white/20 text-xs font-mono">{log.ipAddress}</span>
                    )}
                  </div>
                </div>
                <span className="text-white/20 text-xs flex-shrink-0">{formatDate(log.createdAt)}</span>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}
            className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs text-white/40 border border-white/10 disabled:opacity-30">
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-xs text-white/30">Page {page} / {pages}</span>
          <button disabled={page === pages} onClick={() => setPage(page + 1)}
            className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs text-white/40 border border-white/10 disabled:opacity-30">
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
