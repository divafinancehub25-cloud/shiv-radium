"use client";
import { useState, useTransition } from "react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { adminAdjustBalance, adminSetPortfolioStatus } from "@/actions/diva/portfolio";
import { Plus, Minus, RotateCcw, Shield, ShieldOff, ShieldAlert, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { DivaPortfolioStatus } from "@prisma/client";

type Props = {
  userId: string;
  userName: string;
  currentStatus: DivaPortfolioStatus;
  onSuccess?: () => void;
};

const statusOptions: { value: DivaPortfolioStatus; label: string; icon: any; color: string }[] = [
  { value: "ACTIVE", label: "Activate", icon: Shield, color: "text-emerald-400" },
  { value: "SUSPENDED", label: "Suspend", icon: ShieldAlert, color: "text-yellow-400" },
  { value: "FROZEN", label: "Freeze", icon: ShieldOff, color: "text-blue-400" },
  { value: "CLOSED", label: "Close Account", icon: XCircle, color: "text-red-400" },
];

export function AdminBalanceControls({ userId, userName, currentStatus, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [adjType, setAdjType] = useState<"CREDIT" | "DEBIT" | "CORRECTION">("CREDIT");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [activeTab, setActiveTab] = useState<"balance" | "status">("balance");

  async function handleAdjust() {
    if (!amount || !reason) { toast.error("Amount and reason are required"); return; }
    startTransition(async () => {
      const res = await adminAdjustBalance({ userId, adjustmentType: adjType, amount: Number(amount), reason });
      if ("error" in res) { toast.error(res.error); return; }
      toast.success("Balance adjusted successfully");
      setAmount(""); setReason("");
      onSuccess?.();
    });
  }

  async function handleStatus(status: DivaPortfolioStatus) {
    if (!statusReason) { toast.error("Reason required"); return; }
    startTransition(async () => {
      const res = await adminSetPortfolioStatus({ userId, status, reason: statusReason });
      if ("error" in res) { toast.error(res.error); return; }
      toast.success(`Account status changed to ${status}`);
      setStatusReason("");
      onSuccess?.();
    });
  }

  return (
    <GlassCard className="p-6">
      <h3 className="text-sm font-semibold text-white mb-1">Admin Controls</h3>
      <p className="text-xs text-white/30 mb-4">{userName}</p>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] mb-5">
        {(["balance", "status"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              activeTab === t ? "bg-[#D4AF37] text-black" : "text-white/40 hover:text-white/70"
            }`}
          >
            {t === "balance" ? "Balance Adjustment" : "Account Status"}
          </button>
        ))}
      </div>

      {activeTab === "balance" && (
        <div className="space-y-3">
          {/* Type selector */}
          <div className="grid grid-cols-3 gap-2">
            {(["CREDIT", "DEBIT", "CORRECTION"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setAdjType(t)}
                className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                  adjType === t
                    ? t === "CREDIT" ? "border-emerald-400 bg-emerald-400/10 text-emerald-400"
                      : t === "DEBIT" ? "border-red-400 bg-red-400/10 text-red-400"
                      : "border-yellow-400 bg-yellow-400/10 text-yellow-400"
                    : "border-white/[0.08] text-white/30 hover:text-white/60"
                }`}
              >
                {t === "CREDIT" ? <Plus className="w-3.5 h-3.5 inline mr-1" /> : t === "DEBIT" ? <Minus className="w-3.5 h-3.5 inline mr-1" /> : <RotateCcw className="w-3.5 h-3.5 inline mr-1" />}
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Amount (USD)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/40"
            />
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Reason / Notes</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Reason for adjustment..."
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/40 resize-none"
            />
          </div>

          <button
            onClick={handleAdjust}
            disabled={isPending}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              adjType === "CREDIT" ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-90 text-white"
              : adjType === "DEBIT" ? "bg-gradient-to-r from-red-600 to-red-500 hover:opacity-90 text-white"
              : "bg-gradient-to-r from-yellow-600 to-yellow-500 hover:opacity-90 text-black"
            } disabled:opacity-50`}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Apply {adjType.charAt(0) + adjType.slice(1).toLowerCase()}
          </button>
        </div>
      )}

      {activeTab === "status" && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/40 mb-2 block">
              Current: <span className="text-white/70 font-medium">{currentStatus}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => handleStatus(value)}
                  disabled={isPending || value === currentStatus || !statusReason}
                  className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border border-white/[0.08] text-xs font-medium transition-all hover:bg-white/[0.05] disabled:opacity-30 ${color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Reason (required)</label>
            <textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              rows={2}
              placeholder="Reason for status change..."
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/40 resize-none"
            />
          </div>
        </div>
      )}
    </GlassCard>
  );
}
