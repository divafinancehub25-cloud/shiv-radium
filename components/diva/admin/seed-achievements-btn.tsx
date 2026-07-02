"use client";

import { useState } from "react";
import { adminSeedDefaultAchievements } from "@/actions/diva/achievements";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export function SeedAchievementsBtn() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const seed = async () => {
    setLoading(true);
    const res = await adminSeedDefaultAchievements();
    if (res.success) {
      toast.success("Default achievements seeded!");
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={seed}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-sm font-medium hover:bg-[#D4AF37]/25 transition-colors disabled:opacity-50"
    >
      <Sparkles className="w-4 h-4" />
      {loading ? "Seeding..." : "Seed Defaults"}
    </button>
  );
}
