"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/diva/ui/glass-card";
import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon: LucideIcon;
  delay?: number;
};

export function StatsCard({ title, value, change, positive, icon: Icon, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <GlassCard hover className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {change && (
              <p className={`text-xs font-medium ${positive ? "text-emerald-400" : "text-red-400"}`}>
                {positive ? "↑" : "↓"} {change}
              </p>
            )}
          </div>
          <div className="rounded-xl bg-[#D4AF37]/10 p-2.5">
            <Icon className="h-5 w-5 text-[#D4AF37]" />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
