import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserScenarios, getUserMilestones } from "@/actions/diva/forecasting";
import { prisma } from "@/lib/prisma";
import { ExportCenter } from "@/components/diva/forecasting/export-center";

export const metadata = { title: "Export Center — DIVA" };

export default async function ExportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/diva-app/login");

  const [scenariosRes, milestonesRes, portfolio, user] = await Promise.all([
    getUserScenarios(),
    getUserMilestones(),
    prisma.divaPortfolio.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true } }),
  ]);

  const scenarios = "error" in scenariosRes ? [] : scenariosRes.scenarios;
  const milestones = "error" in milestonesRes ? [] : milestonesRes.milestones;
  const balance = Number(portfolio?.currentBalance ?? 0);
  const name = user?.name ?? user?.email ?? "DIVA Member";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Export Center</h1>
        <p className="text-white/40 text-sm">Download your forecast reports and portfolio data</p>
      </div>
      <ExportCenter
        scenarios={scenarios as any}
        milestones={milestones as any}
        currentBalance={balance}
        userName={name}
      />
    </div>
  );
}
