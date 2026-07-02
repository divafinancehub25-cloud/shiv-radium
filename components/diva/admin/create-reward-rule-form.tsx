"use client";

import { useState } from "react";
import { adminCreateRewardRule } from "@/actions/diva/rewards";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const REWARD_TYPES = ["POINTS", "BADGE", "CREDIT", "TIER_ADVANCEMENT"] as const;
const TRIGGER_EVENTS = [
  "FIRST_REFERRAL",
  "REFERRAL_ACTIVATED",
  "KYC_APPROVED",
  "FIRST_DEPOSIT",
  "PROFILE_COMPLETED",
  "FIVE_REFERRALS",
  "TEN_REFERRALS",
];

export function CreateRewardRuleForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    ruleName: "",
    description: "",
    rewardType: "POINTS" as typeof REWARD_TYPES[number],
    rewardValue: "",
    triggerEvent: "FIRST_REFERRAL",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ruleName || !form.rewardValue) return;
    setLoading(true);
    const res = await adminCreateRewardRule({
      ruleName: form.ruleName,
      description: form.description || undefined,
      rewardType: form.rewardType,
      rewardValue: parseFloat(form.rewardValue),
      triggerEvent: form.triggerEvent,
    });
    if (res.success) {
      toast.success("Reward rule created!");
      setForm({ ruleName: "", description: "", rewardType: "POINTS", rewardValue: "", triggerEvent: "FIRST_REFERRAL" });
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed");
    }
    setLoading(false);
  };

  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#D4AF37]/50 transition-colors";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-xs text-white/40 block mb-1.5">Rule Name *</label>
        <input value={form.ruleName} onChange={(e) => set("ruleName", e.target.value)} placeholder="e.g. First Referral Bonus" className={inputCls} required />
      </div>
      <div>
        <label className="text-xs text-white/40 block mb-1.5">Description</label>
        <input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Optional description" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/40 block mb-1.5">Reward Type *</label>
          <select value={form.rewardType} onChange={(e) => set("rewardType", e.target.value)} className={inputCls}>
            {REWARD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-1.5">Value *</label>
          <input type="number" value={form.rewardValue} onChange={(e) => set("rewardValue", e.target.value)} placeholder="100" className={inputCls} required />
        </div>
      </div>
      <div>
        <label className="text-xs text-white/40 block mb-1.5">Trigger Event *</label>
        <select value={form.triggerEvent} onChange={(e) => set("triggerEvent", e.target.value)} className={inputCls}>
          {TRIGGER_EVENTS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-50">
        {loading ? "Creating..." : "Create Rule"}
      </button>
    </form>
  );
}
