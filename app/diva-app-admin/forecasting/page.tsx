import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { adminForecastStats } from "@/actions/diva/forecasting";
import { ForecastAdminDashboard } from "@/components/diva/admin/forecast-admin-dashboard";

export const metadata = { title: "Forecast Analytics — DIVA Admin" };

export default async function AdminForecastPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/diva-app/login");
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) redirect("/diva-app-admin");

  const res = await adminForecastStats();
  const stats = "error" in res
    ? { totalScenarios: 0, totalMilestones: 0, activeUsers: 0, avgGrowthRate: 0, topScenarios: [], milestoneByStatus: [] }
    : res;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Forecast Analytics</h1>
        <p className="text-white/40 text-sm">Platform-wide forecasting and planning statistics</p>
      </div>
      <ForecastAdminDashboard stats={stats} />
    </div>
  );
}
