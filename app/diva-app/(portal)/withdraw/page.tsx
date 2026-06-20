import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { WithdrawalBalanceCards } from "@/components/diva/withdrawal/withdrawal-balance-cards";
import { WithdrawalForm } from "@/components/diva/withdrawal/withdrawal-form";
import { History } from "lucide-react";

export const metadata = { title: "Withdraw — DIVA" };

export default async function WithdrawPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/diva-app/login");

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Withdraw Funds</h1>
          <p className="text-white/40 text-sm mt-1">Request a withdrawal to your external wallet. Funds are locked while under review.</p>
        </div>
        <Link href="/diva-app/withdraw/history"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/60 text-sm hover:text-white transition-colors">
          <History className="w-4 h-4" /> History
        </Link>
      </div>

      <WithdrawalBalanceCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WithdrawalForm />
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6">
            <h3 className="text-white font-semibold text-sm mb-3">How withdrawals work</h3>
            <ol className="space-y-2.5 text-xs text-white/50">
              <li className="flex gap-2"><span className="text-[#D4AF37] font-bold">1.</span> Submit a request — the amount is locked from your available balance.</li>
              <li className="flex gap-2"><span className="text-[#D4AF37] font-bold">2.</span> Our team reviews your request (status: Under Review).</li>
              <li className="flex gap-2"><span className="text-[#D4AF37] font-bold">3.</span> On approval, funds are settled and sent to your wallet.</li>
              <li className="flex gap-2"><span className="text-[#D4AF37] font-bold">4.</span> If rejected, the locked funds are released back to available.</li>
              <li className="flex gap-2"><span className="text-[#D4AF37] font-bold">5.</span> You can cancel a pending request anytime to release the lock.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
