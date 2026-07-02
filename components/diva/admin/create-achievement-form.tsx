"use client";

import { useState } from "react";
import { adminCreateAchievement } from "@/actions/diva/achievements";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { DivaAchievementTrigger } from "@prisma/client";

const TRIGGERS: DivaAchievementTrigger[] = [
  "PROFILE_COMPLETED", "KYC_APPROVED", "FIRST_DEPOSIT",
  "FIRST_REFERRAL", "FIVE_REFERRALS", "TEN_REFERRALS",
  "COMMUNITY_ACTIVE", "DEPOSIT_MILESTONE", "REFERRAL_MILESTONE",
];

export function CreateAchievementForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", badgeIcon: "🏆", badgeColor: "#D4AF37",
    trigger: "FIRST_REFERRAL" as DivaAchievementTrigger,
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description) return;
    setLoading(true);
    const res = await adminCreateAchievement(form);
    if (res.success) {
      toast.success("Achievement created!");
      setForm({ name: "", description: "", badgeIcon: "🏆", badgeColor: "#D4AF37", trigger: "FIRST_REFERRAL" });
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
        <label className="text-xs text-white/40 block mb-1.5">Name *</label>
        <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. First Referral" className={inputCls} required />
      </div>
      <div>
        <label className="text-xs text-white/40 block mb-1.5">Description *</label>
        <input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What this badge is for" className={inputCls} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/40 block mb-1.5">Badge Emoji</label>
          <input value={form.badgeIcon} onChange={(e) => set("badgeIcon", e.target.value)} placeholder="🏆" className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-1.5">Badge Color</label>
          <input type="color" value={form.badgeColor} onChange={(e) => set("badgeColor", e.target.value)} className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] cursor-pointer" />
        </div>
      </div>
      <div>
        <label className="text-xs text-white/40 block mb-1.5">Trigger *</label>
        <select value={form.trigger} onChange={(e) => set("trigger", e.target.value)} className={inputCls}>
          {TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-50">
        {loading ? "Creating..." : "Create Achievement"}
      </button>
    </form>
  );
}
