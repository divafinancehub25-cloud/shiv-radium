"use client";
import { useState, useTransition, useCallback, useEffect } from "react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { createScenario, deleteScenario, duplicateScenario, togglePinScenario, updateScenario } from "@/actions/diva/forecasting";
import { fmtMoney, fmtPct, calcForecast } from "@/lib/diva/forecast-engine";
import { toast } from "sonner";
import { Plus, Pin, Copy, Trash2, Edit2, Check, X, Loader2, TrendingUp } from "lucide-react";
import type { ScenarioRow } from "@/types/diva/forecasting";
import type { DivaCompoundingFreq, DivaContributionFreq as DivaContribFreq } from "@prisma/client";

const SCENARIO_COLORS = ["#D4AF37", "#34d399", "#f87171", "#818cf8", "#fb923c", "#38bdf8"];

type Props = { initial: ScenarioRow[] };

type FormState = {
  scenarioName: string; initialAmount: string; contributionAmount: string;
  durationYears: string; growthRate: string; compoundingFreq: DivaCompoundingFreq;
  contributionFreq: DivaContribFreq; color: string;
};

const EMPTY_FORM: FormState = {
  scenarioName: "", initialAmount: "10000", contributionAmount: "500",
  durationYears: "10", growthRate: "8", compoundingFreq: "MONTHLY",
  contributionFreq: "MONTHLY", color: "#D4AF37",
};

export function ScenarioManager({ initial }: Props) {
  const [scenarios, setScenarios] = useState<ScenarioRow[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  function field(k: keyof FormState) {
    return { value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value })) };
  }

  async function handleSave() {
    const data = {
      scenarioName: form.scenarioName,
      initialAmount: Number(form.initialAmount),
      contributionAmount: Number(form.contributionAmount),
      durationYears: Number(form.durationYears),
      growthRate: Number(form.growthRate),
      compoundingFreq: form.compoundingFreq,
      contributionFreq: form.contributionFreq,
      color: form.color,
    };
    startTransition(async () => {
      if (editId) {
        const res = await updateScenario({ id: editId, ...data });
        if ("error" in res) { toast.error(res.error); return; }
        toast.success("Scenario updated");
        setEditId(null);
      } else {
        const res = await createScenario(data);
        if ("error" in res) { toast.error(res.error); return; }
        toast.success("Scenario saved");
      }
      setForm(EMPTY_FORM); setShowForm(false);
      window.location.reload();
    });
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteScenario(id);
      if ("error" in res) { toast.error(res.error); return; }
      setScenarios(s => s.filter(x => x.id !== id));
      toast.success("Deleted");
    });
  }

  async function handleDuplicate(id: string) {
    startTransition(async () => {
      const res = await duplicateScenario(id);
      if ("error" in res) { toast.error(res.error); return; }
      toast.success("Duplicated"); window.location.reload();
    });
  }

  async function handlePin(id: string) {
    startTransition(async () => {
      await togglePinScenario(id);
      setScenarios(s => s.map(x => x.id === id ? { ...x, isPinned: !x.isPinned } : x));
    });
  }

  function startEdit(s: ScenarioRow) {
    setForm({
      scenarioName: s.scenarioName,
      initialAmount: String(Number(s.initialAmount)),
      contributionAmount: String(Number(s.contributionAmount)),
      durationYears: String(s.durationYears),
      growthRate: String(Number(s.growthRate)),
      compoundingFreq: s.compoundingFreq,
      contributionFreq: s.contributionFreq,
      color: s.color,
    });
    setEditId(s.id); setShowForm(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Saved Scenarios</h2>
          <p className="text-xs text-white/30 mt-0.5">{scenarios.length} scenarios saved</p>
        </div>
        <button onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-black text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> New Scenario
        </button>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <GlassCard className="p-6 border border-[#D4AF37]/20">
          <h3 className="text-sm font-semibold text-white mb-4">{editId ? "Edit Scenario" : "Create Scenario"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs text-white/40 mb-1 block">Scenario Name</label>
              <input {...field("scenarioName")} placeholder="e.g. Retirement Plan" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/40" />
            </div>
            {[
              { k: "initialAmount" as const, label: "Initial Amount ($)", type: "number" },
              { k: "contributionAmount" as const, label: "Monthly Contribution ($)", type: "number" },
              { k: "durationYears" as const, label: "Duration (Years)", type: "number" },
              { k: "growthRate" as const, label: "Annual Growth Rate (%)", type: "number" },
            ].map(({ k, label, type }) => (
              <div key={k}>
                <label className="text-xs text-white/40 mb-1 block">{label}</label>
                <input {...field(k)} type={type} className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#D4AF37]/40" />
              </div>
            ))}
            <div>
              <label className="text-xs text-white/40 mb-1 block">Compounding</label>
              <select {...field("compoundingFreq")} className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#D4AF37]/40">
                {["DAILY","MONTHLY","QUARTERLY","ANNUALLY"].map(v => <option key={v} value={v}>{v.charAt(0) + v.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Contribution Frequency</label>
              <select {...field("contributionFreq")} className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#D4AF37]/40">
                {["MONTHLY","QUARTERLY","ANNUALLY"].map(v => <option key={v} value={v}>{v.charAt(0) + v.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-2 block">Color</label>
              <div className="flex gap-2">
                {SCENARIO_COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={`w-6 h-6 rounded-full transition-all ${form.color === c ? "ring-2 ring-white/50 scale-110" : ""}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50">
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {editId ? "Update" : "Save Scenario"}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}
              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/60 text-sm transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>
      )}

      {/* Scenario grid */}
      {scenarios.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <TrendingUp className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No scenarios yet. Create your first forecast scenario.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map(s => {
            const computed = calcForecast({
              initialAmount: Number(s.initialAmount),
              contributionAmount: Number(s.contributionAmount),
              contributionFreq: s.contributionFreq as any,
              durationYears: s.durationYears,
              growthRate: Number(s.growthRate),
              compoundingFreq: s.compoundingFreq as any,
            });
            return (
              <GlassCard key={s.id} className="p-5" style={{ borderColor: s.color + "25" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <h4 className="text-sm font-semibold text-white leading-tight">{s.scenarioName}</h4>
                    {s.isPinned && <Pin className="w-3 h-3 text-[#D4AF37]" />}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handlePin(s.id)} className="w-6 h-6 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-white/30 hover:text-[#D4AF37] transition-all">
                      <Pin className="w-3 h-3" />
                    </button>
                    <button onClick={() => startEdit(s)} className="w-6 h-6 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-white/30 hover:text-white transition-all">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDuplicate(s.id)} className="w-6 h-6 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-white/30 hover:text-white transition-all">
                      <Copy className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="w-6 h-6 rounded-lg bg-white/[0.05] hover:bg-red-400/20 flex items-center justify-center text-white/30 hover:text-red-400 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-xs text-white/30">Projected ({s.durationYears}y)</span>
                    <span className="text-sm font-bold" style={{ color: s.color }}>{fmtMoney(computed.projectedValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-white/30">Growth Rate</span>
                    <span className="text-xs text-emerald-400">{fmtPct(Number(s.growthRate))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-white/30">Initial</span>
                    <span className="text-xs text-white/60">{fmtMoney(Number(s.initialAmount))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-white/30">Monthly</span>
                    <span className="text-xs text-white/60">{fmtMoney(Number(s.contributionAmount))}</span>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
