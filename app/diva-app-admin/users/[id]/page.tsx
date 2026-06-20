"use client";
import { useParams } from "next/navigation";
import { GlassCard } from "@/components/diva/ui/glass-card";

export default function DivaAdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold text-white">Member Detail</h1>
      <GlassCard className="p-6 text-white/50 text-sm">
        Loading member <span className="text-[#D4AF37]">{id}</span>…
      </GlassCard>
    </div>
  );
}
