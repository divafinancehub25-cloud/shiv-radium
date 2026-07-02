"use client";

import { useState } from "react";
import { acknowledgeAlert, resolveAlert } from "@/actions/diva/alerts";
import { toast } from "sonner";
import { CheckCircle, Eye } from "lucide-react";

const sev = {
  CRITICAL: "text-red-400 bg-red-400/10 border-red-400/20",
  WARNING: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  INFO: "text-blue-400 bg-blue-400/10 border-blue-400/20",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function AlertRow({ alert, onAction }: { alert: any; onAction: () => void }) {
  const [loading, setLoading] = useState(false);

  const ack = async () => {
    setLoading(true);
    const res = await acknowledgeAlert(alert.id);
    if (res.success) { toast.success("Alert acknowledged"); onAction(); }
    else toast.error(res.error ?? "Failed");
    setLoading(false);
  };

  const resolve = async () => {
    setLoading(true);
    const res = await resolveAlert(alert.id);
    if (res.success) { toast.success("Alert resolved"); onAction(); }
    else toast.error(res.error ?? "Failed");
    setLoading(false);
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${sev[alert.severity as keyof typeof sev] ?? sev.INFO}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold">{alert.severity}</span>
          <span className="text-white/20 text-[10px]">·</span>
          <span className="text-white/30 text-[10px]">{fmtDate(alert.createdAt)}</span>
          {alert.status !== "OPEN" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/40">{alert.status}</span>
          )}
        </div>
        <p className="text-white text-sm font-medium">{alert.title}</p>
        <p className="text-white/50 text-xs mt-0.5">{alert.message}</p>
      </div>
      {alert.status === "OPEN" && (
        <div className="flex gap-2 shrink-0">
          <button onClick={ack} disabled={loading} title="Acknowledge" className="p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors disabled:opacity-50">
            <Eye className="w-3.5 h-3.5 text-white/40" />
          </button>
          <button onClick={resolve} disabled={loading} title="Resolve" className="p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors disabled:opacity-50">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      )}
    </div>
  );
}
