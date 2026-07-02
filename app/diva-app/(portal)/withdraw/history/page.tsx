import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { WithdrawalHistoryTable } from "@/components/diva/withdrawal/withdrawal-history-table";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Withdrawal History — DIVA" };

export default async function WithdrawHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/diva-app/login");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/diva-app/withdraw" className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/50 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white">Withdrawal History</h1>
          <p className="text-white/40 text-sm mt-0.5">Track and manage all your withdrawal requests.</p>
        </div>
      </div>

      <WithdrawalHistoryTable />
    </div>
  );
}
