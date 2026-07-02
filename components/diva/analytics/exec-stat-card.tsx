import { GlassCard } from "@/components/diva/ui/glass-card";
import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
};

export function ExecStatCard({ label, value, sub, icon: Icon, iconColor, iconBg }: Props) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-white/40">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{typeof value === "number" ? value.toLocaleString() : value}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </GlassCard>
  );
}
