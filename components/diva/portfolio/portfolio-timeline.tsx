"use client";
import { GlassCard } from "@/components/diva/ui/glass-card";
import type { DivaPortfolioEventType } from "@prisma/client";
import { CheckCircle, Plus, Minus, RotateCcw, Settings, AlertTriangle, Zap } from "lucide-react";

type Event = {
  id: string;
  eventType: DivaPortfolioEventType;
  eventDescription: string;
  createdAt: Date | string;
};

const iconMap: Record<DivaPortfolioEventType, { Icon: any; color: string; bg: string }> = {
  PORTFOLIO_CREATED: { Icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  DEPOSIT_CREDITED:  { Icon: Plus,        color: "text-[#D4AF37]",   bg: "bg-[#D4AF37]/10"  },
  ADMIN_CREDIT:      { Icon: Plus,        color: "text-blue-400",    bg: "bg-blue-400/10"   },
  ADMIN_DEBIT:       { Icon: Minus,       color: "text-red-400",     bg: "bg-red-400/10"    },
  STATUS_CHANGED:    { Icon: AlertTriangle,color:"text-yellow-400",  bg: "bg-yellow-400/10" },
  BALANCE_CORRECTION:{ Icon: RotateCcw,   color: "text-purple-400",  bg: "bg-purple-400/10" },
  SYSTEM_ADJUSTMENT:  { Icon: Zap,         color: "text-cyan-400",    bg: "bg-cyan-400/10"   },
  WITHDRAWAL_DEBITED: { Icon: Minus,       color: "text-orange-400",  bg: "bg-orange-400/10" },
};

function fmtDate(v: Date | string) {
  return new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function PortfolioTimeline({ events }: { events: Event[] }) {
  return (
    <GlassCard className="p-6">
      <h3 className="text-sm font-semibold text-white mb-5">Portfolio Timeline</h3>
      {events.length === 0 ? (
        <p className="text-white/20 text-sm text-center py-8">No events yet</p>
      ) : (
        <div className="space-y-0">
          {events.map((ev, i) => {
            const cfg = iconMap[ev.eventType] ?? { Icon: Settings, color: "text-white/40", bg: "bg-white/5" };
            return (
              <div key={ev.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <cfg.Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  {i < events.length - 1 && <div className="w-px flex-1 bg-white/[0.06] mt-1 mb-1" />}
                </div>
                <div className="pb-4 min-w-0">
                  <p className="text-sm text-white/80 leading-snug">{ev.eventDescription}</p>
                  <p className="text-xs text-white/30 mt-0.5">{fmtDate(ev.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
