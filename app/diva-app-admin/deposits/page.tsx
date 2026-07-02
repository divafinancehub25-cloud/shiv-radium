import { DepositStatsPanel } from "@/components/diva/admin/deposit-stats";
import { DepositReviewTable } from "@/components/diva/admin/deposit-review-table";

export const metadata = { title: "Deposit Review — DIVA Admin" };

export default function DivaAdminDepositsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Deposit Overview</h1>
        <p className="text-white/40 text-sm mt-1">Monitor, review, and approve member deposits.</p>
      </div>
      <DepositStatsPanel />
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Review Queue</h2>
        <DepositReviewTable />
      </div>
    </div>
  );
}
