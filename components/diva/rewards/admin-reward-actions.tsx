"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { adminCreateRewardRule } from "@/actions/diva/rewards";
import { toast } from "sonner";
import type { DivaRewardType } from "@prisma/client";

const rewardTypes: DivaRewardType[] = ["POINTS", "BADGE", "CREDIT", "TIER_ADVANCEMENT"];
const triggerEvents = ["REFERRAL_ACTIVATED", "KYC_APPROVED", "FIRST_DEPOSIT", "FIVE_REFERRALS", "TEN_REFERRALS", "PROFILE_COMPLETED"];

export function AdminRewardActions() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ ruleName: "", description: "", rewardType: "POINTS" as DivaRewardType, rewardValue: 100, triggerEvent: "REFERRAL_ACTIVATED" });

  const submit = () => {
    if (!form.ruleName) { toast.error("Rule name required"); return; }
    startTransition(async () => {
      const res = await adminCreateRewardRule(form);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Reward rule created!");
      setOpen(false);
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
      >
        <Plus className="w-4 h-4" /> New Rule
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-[#111] border border-white/10 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">New Reward Rule</h2>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <input value={form.ruleName} onChange={(e) => setForm((f) => ({ ...f, ruleName: e.target.value }))} placeholder="Rule name..." className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40" />
            <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description (optional)..." className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40" />

            <div className="grid grid-cols-2 gap-3">
              <select value={form.rewardType} onChange={(e) => setForm((f) => ({ ...f, rewardType: e.target.value as DivaRewardType }))} className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none">
                {rewardTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="number" value={form.rewardValue} onChange={(e) => setForm((f) => ({ ...f, rewardValue: Number(e.target.value) }))} placeholder="Value" className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none" />
            </div>

            <select value={form.triggerEvent} onChange={(e) => setForm((f) => ({ ...f, triggerEvent: e.target.value }))} className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none">
              {triggerEvents.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            <button onClick={submit} disabled={pending} className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50">
              {pending ? "Creating..." : "Create Rule"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
