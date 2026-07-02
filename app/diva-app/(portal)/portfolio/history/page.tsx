"use client";
import { useEffect, useState, useCallback } from "react";
import { getUserPortfolioEvents } from "@/actions/diva/portfolio";
import { PortfolioTimeline } from "@/components/diva/portfolio/portfolio-timeline";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { DivaPortfolioEventType } from "@prisma/client";

type Event = { id: string; eventType: DivaPortfolioEventType; eventDescription: string; createdAt: Date | string };

export default function PortfolioHistoryPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await getUserPortfolioEvents(100);
      if ("events" in res) setEvents(res.events as any);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/diva-app/portfolio" className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-white/60 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Portfolio History</h1>
          <p className="text-xs text-white/30">Complete activity timeline</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" /></div>
      ) : (
        <PortfolioTimeline events={events} />
      )}
    </div>
  );
}
