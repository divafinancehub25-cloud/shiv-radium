"use client";

import { useTransition } from "react";
import { adminSeedDefaultAchievements } from "@/actions/diva/achievements";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";

export function AdminAchievementActions({ hasDefaults }: { hasDefaults: boolean }) {
  const [pending, startTransition] = useTransition();

  const seed = () => {
    startTransition(async () => {
      const res = await adminSeedDefaultAchievements();
      if (res.error) { toast.error(res.error); return; }
      toast.success("Default achievements seeded!");
    });
  };

  return (
    <div className="flex gap-2">
      {hasDefaults && (
        <button
          onClick={seed}
          disabled={pending}
          className="flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
        >
          <Wand2 className="w-4 h-4" />
          {pending ? "Seeding..." : "Seed Defaults"}
        </button>
      )}
    </div>
  );
}
