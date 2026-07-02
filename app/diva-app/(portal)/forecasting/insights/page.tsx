import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserInsights, getUserHistoricalData } from "@/actions/diva/forecasting";
import { PortfolioInsights } from "@/components/diva/forecasting/portfolio-insights";
import { HistoricalAnalytics } from "@/components/diva/forecasting/historical-analytics";

export const metadata = { title: "Insights & Analytics — DIVA" };

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/diva-app/login");

  const [insightsRes, histRes] = await Promise.all([
    getUserInsights(),
    getUserHistoricalData("30d"),
  ]);

  const insights = "error" in insightsRes
    ? { balance: 0, totalDeposited: 0, last30Deposited: 0, depositCount: 0, scenarioCount: 0, portfolioStatus: "ACTIVE" }
    : insightsRes;

  const histPoints = "error" in histRes ? [] : histRes.points as any[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Insights & Analytics</h1>
        <p className="text-white/40 text-sm">Deep-dive into your portfolio performance and activity</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Portfolio Insights</h2>
        <PortfolioInsights data={insights} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Historical Analytics</h2>
        <HistoricalAnalytics initial={histPoints} />
      </section>
    </div>
  );
}
