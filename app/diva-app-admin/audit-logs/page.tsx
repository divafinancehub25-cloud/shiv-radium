import { AuditLogTable } from "@/components/diva/admin/audit-log-table";

export const metadata = { title: "Audit Logs — DIVA Admin" };

export default function DivaAdminAuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Audit Trail</h1>
        <p className="text-white/40 text-sm mt-1">Complete log of all system actions and admin operations.</p>
      </div>
      <AuditLogTable />
    </div>
  );
}
