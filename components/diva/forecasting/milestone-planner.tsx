"use client";
import { useState, useTransition } from "react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { createMilestone, updateMilestone, deleteMilestone } from "@/actions/diva/forecasting";
import { estimateYearsToTarget, fmtMoney } from "@/lib/diva/forecast-engine";
import { toast } from "sonner";
import { Plus, Target, Trash2, Edit2, Check, X, Loader2, TrendingUp, Calendar, Flag } from "lucide-react";
import type { MilestoneRow } from "@/types/diva/forecasting";
import type { DivaMilestoneStatus } from "@prisma/client";

type Props = { initial: MilestoneRow[]; currentBalance: number; monthlyContrib?: number };

const STATUS_CFG: Record<DivaMilestoneStatus, { label: string; color: string; bg: string }> = {
  IN_PROGRESS: { label: "In Progress", color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
  ACHIEVED: { label: "Achieved ✓", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  MISSED: { label: "Missed", color: "text-red-400", bg: "bg-red-400/10" },
  CANCELLED: { label: "Cancelled", color: "text-white/30", bg: "bg-white/5" },
};

export function MilestonePlanner({ initial, currentBalance, monthlyContrib = 0 }: Props) {
  const [milestones, setMilestones] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ milestoneName: "", targetAmount: "", targetDate: "", notes: "" });
  const [isPending, startTransition] = useTransition();

  function f(k: keyof typeof form) {
    return { value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value })) };
  }

  async function handleSave() {
    const data = {
      milestoneName: form.milestoneName,
      targetAmount: Number(form.targetAmount),
      targetDate: form.targetDate ? new Date(form.targetDate).toISOString() : undefined,
      notes: form.notes || undefined,
    };
    startTransition(async () => {
      if (editId) {
        const res = await updateMilestone({ id: editId, ...data });
        if ("error" in res) { toast.error(res.error); return; }
        toast.success("Milestone updated"); window.location.reload();
      } else {
        const res = await createMilestone(data);
        if ("error" in res) { toast.error(res.error); return; }
        toast.success("Milestone created!"); window.location.reload();
      }
      setShowForm(false); setEditId(null);
    });
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      await deleteMilestone(id);
      setMilestones(m => m.filter(x => x.id !== id));
      toast.success("Deleted");
    });
  }

  async function handleStatus(id: string, status: DivaMilestoneStatus) {
    startTransition(async () => {
      await updateMilestone({ id, status });
      setMilestones(m => m.map(x => x.id === id ? { ...x, status } : x));
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Milestones</h2>
          <p className="text-xs text-white/30 mt-0.5">Track your financial goals</p>
        </div>
        <button onClick={() => { setForm({ milestoneName: "", targetAmount: "", targetDate: "", notes: "" }); setEditId(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-black text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Milestone
        </button>
      </div>

      {showForm && (
        <GlassCard className="p-6 border border-[#D4AF37]/20">
          <h3 className="text-sm font-semibold text-white mb-4">{editId ? "Edit" : "New"} Milestone</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs text-white/40 mb-1 block">Milestone Name</label>
              <input {...f("milestoneName")} placeholder="e.g. First $100K" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/40" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Target Amount ($)</label>
              <input {...f("targetAmount")} type="number" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#D4AF37]/40" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Target Date (optional)</label>
              <input {...f("targetDate")} type="date" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#D4AF37]/40" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-white/40 mb-1 block">Notes (optional)</label>
              <textarea {...f("notes")} rows={2} className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/40 resize-none" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50">
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save
            </button>
            <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-white/40">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>
      )}

      {milestones.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Flag className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No milestones yet. Set your first financial target.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {milestones.map(m => {
            const target = Number(m.targetAmount);
            const pct = Math.min(100, (currentBalance / target) * 100);
            const remaining = Math.max(0, target - currentBalance);
            const yearsEst = estimateYearsToTarget(currentBalance, target, monthlyContrib, 8);
            const cfg = STATUS_CFG[m.status];

            return (
              <GlassCard key={m.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#D4AF37]" />
                    <h4 className="text-sm font-semibold text-white">{m.milestoneName}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(m.id)} className="w-5 h-5 flex items-center justify-center text-white/20 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/40">{fmtMoney(currentBalance)}</span>
                    <span className="text-[#D4AF37] font-semibold">{fmtMoney(target)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F5D76E] transition-all duration-500"
                      style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-white/30 mt-1">
                    <span>{pct.toFixed(1)}% complete</span>
                    <span>{fmtMoney(remaining)} remaining</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  {m.targetDate && (
                    <div className="flex items-center gap-1 text-white/30">
                      <Calendar className="w-3 h-3" />
                      <span>Due: {new Date(m.targetDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {yearsEst !== null && m.status === "IN_PROGRESS" && (
                    <div className="flex items-center gap-1 text-emerald-400">
                      <TrendingUp className="w-3 h-3" />
                      <span>~{yearsEst.toFixed(1)}y at 8% growth</span>
                    </div>
                  )}
                </div>

                {/* Status actions */}
                {m.status === "IN_PROGRESS" && (
                  <div className="flex gap-1.5 mt-3 pt-3 border-t border-white/[0.05]">
                    <button onClick={() => handleStatus(m.id, "ACHIEVED")}
                      className="flex-1 py-1 rounded-lg bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 text-[11px] font-medium transition-colors">
                      Mark Achieved
                    </button>
                    <button onClick={() => handleStatus(m.id, "CANCELLED")}
                      className="px-3 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white/30 text-[11px] transition-colors">
                      Cancel
                    </button>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
