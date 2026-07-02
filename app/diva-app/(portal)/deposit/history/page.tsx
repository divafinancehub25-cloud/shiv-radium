import { DepositHistoryTable } from "@/components/diva/deposit/deposit-history-table";

export const metadata = { title: "Deposit History — DIVA Growth Capital" };

export default function DivaDepositHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Deposit History</h1>
        <p className="text-white/40 text-sm mt-1">Track all your submitted deposits and their approval status.</p>
      </div>
      <DepositHistoryTable />
    </div>
  );
}
