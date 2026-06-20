"use client";
import { useEffect, useState, useCallback } from "react";
import { getUserPortfolio, getUserBalanceTrend, getUserPortfolioEvents } from "@/actions/diva/portfolio";
import { PortfolioBalanceCard } from "@/components/diva/portfolio/portfolio-balance-card";
import { BalanceTrendChart } from "@/components/diva/portfolio/balance-trend-chart";
import { PortfolioTimeline } from "@/components/diva/portfolio/portfolio-timeline";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { DivaPortfolioStatus } from "@prisma/client";

type Portfolio = {
  id: string;
  currentBalance: string;
  availableBalance: string;
  lockedBalance: string;
  status: DivaPortfolioStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type TrendPoint = { date: string; balance: number; deposits: number; adjustments: number };
type Event = { id: string; eventType: any; eventDescription: string; createdAt: Date | string };

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, t, e] = await Promise.all([
      getUserPortfolio(),
      getUserBalanceTrend(),
      getUserPortfolioEvents(10),
    ]);
    if (p.portfolio) setPortfolio(p.portfolio as any);
    if ("trend" in t && t.trend) setTrend(t.trend);
    if ("events" in e && e.events) setEvents(e.events as any);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Portfolio</h1>
          <p className="text-sm text-white/40 mt-0.5">Your investment account overview</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/diva-app/portfolio/transactions"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-sm text-white/70 hover:text-white transition-all border border-white/[0.08]"
          >
            Transactions <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/diva-app/deposit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + Deposit
          </Link>
        </div>
      </div>

      {portfolio ? (
        <>
          <PortfolioBalanceCard
            currentBalance={portfolio.currentBalance.toString()}
            availableBalance={portfolio.availableBalance.toString()}
            lockedBalance={portfolio.lockedBalance.toString()}
            status={portfolio.status}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <BalanceTrendChart data={trend} />
            </div>
            <div>
              <PortfolioTimeline events={events} />
            </div>
          </div>

          <div className="flex justify-end">
            <Link href="/diva-app/portfolio/history" className="text-xs text-[#D4AF37]/70 hover:text-[#D4AF37] transition-colors flex items-center gap-1">
              View full history <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </>
      ) : (
        <GlassCard className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💼</span>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Portfolio Not Yet Active</h2>
          <p className="text-sm text-white/40 mb-5">Make your first deposit to activate your portfolio</p>
          <Link
            href="/diva-app/deposit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Make a Deposit
          </Link>
        </GlassCard>
      )}
    </div>
  );
}
