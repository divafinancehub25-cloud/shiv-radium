import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ForecastDashboard } from "@/components/diva/forecasting/forecast-dashboard";

export const metadata = { title: "Forecast Dashboard — DIVA" };

export default async function ForecastDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/diva-app/login");

  const portfolio = await prisma.divaPortfolio.findUnique({ where: { userId: session.user.id } });
  const balance = Number(portfolio?.currentBalance ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Forecast Dashboard</h1>
        <p className="text-white/40 text-sm">Interactive projections from your current portfolio balance</p>
      </div>
      <ForecastDashboard currentBalance={balance} />
    </div>
  );
}
