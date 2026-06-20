"use client";
import { useSession } from "next-auth/react";
import { GlassCard } from "@/components/diva/ui/glass-card";

export default function DivaProfilePage() {
  const { data: session } = useSession();
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-white">Profile</h1>
      <GlassCard className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8962E] flex items-center justify-center text-black font-bold text-2xl">
            {session?.user?.name?.[0]?.toUpperCase() ?? "D"}
          </div>
          <div>
            <p className="text-white font-semibold text-lg">{session?.user?.name ?? "Member"}</p>
            <p className="text-white/40 text-sm">{session?.user?.email}</p>
          </div>
        </div>
        <div className="border-t border-white/[0.06] pt-4 text-white/50 text-sm">
          Profile editing coming soon.
        </div>
      </GlassCard>
    </div>
  );
}
