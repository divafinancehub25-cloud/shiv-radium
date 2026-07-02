import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { WithdrawalAdminTable } from "@/components/diva/admin/withdrawal-admin-table";

export const metadata = { title: "Withdrawals — DIVA Admin" };

export default async function AdminWithdrawalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/diva-app/login");
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) redirect("/diva-app-admin/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Withdrawal Review Center</h1>
        <p className="text-white/40 text-sm">Review, approve, and process member withdrawal requests.</p>
      </div>
      <WithdrawalAdminTable />
    </div>
  );
}
