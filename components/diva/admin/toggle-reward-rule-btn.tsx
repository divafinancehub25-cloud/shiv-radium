"use client";

import { useState } from "react";
import { adminToggleRewardRule } from "@/actions/diva/rewards";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ToggleRewardRuleBtn({ id, isActive }: { id: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    setLoading(true);
    const res = await adminToggleRewardRule(id, !active);
    if (res.success) {
      setActive(!active);
      toast.success(active ? "Rule disabled" : "Rule enabled");
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`shrink-0 w-10 h-5 rounded-full relative transition-colors ${active ? "bg-emerald-500" : "bg-white/20"} disabled:opacity-50`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${active ? "left-5" : "left-0.5"}`} />
    </button>
  );
}
