import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserMilestones } from "@/actions/diva/forecasting";
import { prisma } from "@/lib/prisma";
import { MilestonePlanner } from "@/components/diva/forecasting/milestone-planner";

export const metadata = { title: "Milestones — DIVA" };

export default async function MilestonesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/diva-app/login");

  const [milestonesRes, portfolio] = await Promise.all([
    getUserMilestones(),
    prisma.divaPortfolio.findUnique({ where: { userId: session.user.id } }),
  ]);

  const milestones = "error" in milestonesRes ? [] : milestonesRes.milestones;
  const balance = Number(portfolio?.currentBalance ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Milestone Planner</h1>
        <p className="text-white/40 text-sm">Set financial targets and track your progress toward each goal</p>
      </div>
      <MilestonePlanner initial={milestones as any} currentBalance={balance} monthlyContrib={500} />
    </div>
  );
}
