"use client";

import { useState, useEffect } from "react";
import { generateReport, getGeneratedReports } from "@/actions/diva/reports";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Download, FileText, Plus } from "lucide-react";
import { toast } from "sonner";

const REPORT_TYPES = [
  { value: "users", label: "User Report", desc: "All registered users with KYC status" },
  { value: "deposits", label: "Deposit Report", desc: "Approved deposits with amounts" },
  { value: "withdrawals", label: "Withdrawal Report", desc: "All withdrawals with network and status" },
  { value: "referrals", label: "Referral Report", desc: "Referral chain with conversion data" },
  { value: "kyc", label: "KYC Report", desc: "KYC submissions and review status" },
  { value: "audit", label: "Audit Log Report", desc: "Admin and system audit trail" },
];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ReportsPage() {
  const [type, setType] = useState("users");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = () => {
    setLoadingHistory(true);
    getGeneratedReports().then((r) => {
      if ("data" in r) setHistory(r.data ?? []);
      setLoadingHistory(false);
    });
  };

  useEffect(() => { loadHistory(); }, []);

  const generate = async () => {
    setGenerating(true);
    const res = await generateReport(type, { from: from || undefined, to: to || undefined });
    if (res.data && res.filename) {
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = res.filename; a.click();
      URL.revokeObjectURL(url);
      toast.success(`${res.filename} downloaded!`);
      loadHistory();
    } else {
      toast.error(res.error ?? "Generation failed");
    }
    setGenerating(false);
  };

  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50 transition-colors";

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Report Builder</h1>
        <p className="text-sm text-white/40 mt-1">Generate and download platform reports as CSV</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Builder */}
        <GlassCard className="p-6">
          <p className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#D4AF37]" /> Generate Report
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/40 block mb-2">Report Type</label>
              <div className="grid grid-cols-1 gap-2">
                {REPORT_TYPES.map((r) => (
                  <label key={r.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${type === r.value ? "border-[#D4AF37]/40 bg-[#D4AF37]/5" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"}`}>
                    <input type="radio" name="type" value={r.value} checked={type === r.value} onChange={(e) => setType(e.target.value)} className="mt-0.5 accent-[#D4AF37]" />
                    <div>
                      <p className="text-white text-xs font-medium">{r.label}</p>
                      <p className="text-white/30 text-[10px]">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/40 block mb-1.5">From Date</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1.5">To Date</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
              </div>
            </div>

            <button
              onClick={generate}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {generating ? "Generating..." : "Generate & Download CSV"}
            </button>
          </div>
        </GlassCard>

        {/* History */}
        <GlassCard className="p-6">
          <p className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
            <FileText className="w-4 h-4 text-white/40" /> Report History
          </p>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-white/30 text-sm py-12">No reports generated yet</p>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[500px]">
              {history.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4AF37]/10 shrink-0">
                    <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{r.reportName}</p>
                    <p className="text-white/30 text-[10px]">{r.generatorName} · {fmtDate(r.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">{r.format}</span>
                    {r.rowCount != null && <p className="text-[10px] text-white/20 mt-0.5">{r.rowCount} rows</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
