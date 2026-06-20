import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { adminFinancialOpsLogs } from "@/actions/diva/withdrawals";
import { FinancialOpsDashboard } from "@/components/diva/admin/financial-ops-dashboard";
import { GlassCard } from "@/components/diva/ui/glass-card";

export const metadata = { title: "Financial Operations — DIVA Admin" };

const ACTION_COLORS: Record<string, string> = {
  WITHDRAWAL_SUBMITTED: "text-amber-400",
  WITHDRAWAL_COMPLETED: "text-emerald-400",
  WITHDRAWAL_REJECTED: "text-red-400",
  WITHDRAWAL_CANCELLED: "text-white/40",
  STATUS_CHANGED: "text-blue-400",
};

export default async function FinancialOpsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/diva-app/login");
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role ?? "")) redirect("/diva-app-admin/dashboard");

  const logsRes = await adminFinancialOpsLogs({ page: 1, limit: 25 });
  const logs = "error" in logsRes ? [] : logsRes.logs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Financial Operations</h1>
        <p className="text-white/40 text-sm">Platform-wide withdrawal analytics and immutable operations audit trail.</p>
      </div>

      <FinancialOpsDashboard />

      <GlassCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">Operations Audit Log</h3>
          <p className="text-[11px] text-white/30 mt-0.5">Immutable record of all financial actions</p>
        </div>
        {logs.length === 0 ? (
          <div className="p-12 text-center text-white/30 text-sm">No operations logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-wider text-white/30">
                  <th className="px-5 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">IP</th>
                  <th className="px-5 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l: any) => (
                  <tr key={l.id} className="border-b border-white/[0.04]">
                    <td className={`px-5 py-3 font-medium text-xs ${ACTION_COLORS[l.actionType] ?? "text-white/60"}`}>{l.actionType.replace(/_/g, " ")}</td>
                    <td className="px-5 py-3 font-mono text-white/30 text-xs">{l.referenceId?.slice(0, 12) ?? "—"}</td>
                    <td className="px-5 py-3 text-white/30 text-xs">{l.ipAddress ?? "—"}</td>
                    <td className="px-5 py-3 text-white/40 text-xs">{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
