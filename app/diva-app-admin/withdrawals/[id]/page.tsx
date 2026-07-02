import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { adminGetWithdrawal } from "@/actions/diva/withdrawals";
import { WithdrawalReviewPanel } from "@/components/diva/admin/withdrawal-review-panel";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Review Withdrawal — DIVA Admin" };

export default async function AdminWithdrawalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/diva-app/login");
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) redirect("/diva-app-admin/dashboard");

  const { id } = await params;
  const res = await adminGetWithdrawal(id);
  if ("error" in res) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/diva-app-admin/withdrawals" className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/50 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Review Withdrawal</h1>
          <p className="text-white/40 text-sm mt-0.5">Validate the request against the member's balance and account status.</p>
        </div>
      </div>

      <WithdrawalReviewPanel
        withdrawal={res.withdrawal}
        portfolio={res.portfolio}
        recentLedger={res.recentLedger}
      />
    </div>
  );
}
