import { listKYCQueue } from "@/actions/diva/admin";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { StatusBadge } from "@/components/diva/ui/status-badge";
import { Clock, Eye } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "KYC Queue | DIVA Admin" };

export default async function AdminKYCPage() {
  const submissions = await listKYCQueue();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">KYC Queue</h1>
        <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-sm text-[#D4AF37]">{submissions.length} pending</span>
      </div>
      <GlassCard className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {["Applicant", "Email", "Submitted", "Status", "Docs", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#B8962E] text-xs font-bold text-black">{s.user.name[0]?.toUpperCase()}</div>
                    <span className="font-medium text-white">{s.user.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400">{s.user.email}</td>
                <td className="px-4 py-3 text-zinc-500">{s.submittedAt ? <span className="flex items-center gap-1.5"><Clock size={12} />{new Date(s.submittedAt).toLocaleDateString()}</span> : "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3 text-zinc-400">{s.documents.length} uploaded</td>
                <td className="px-4 py-3">
                  <Link href={`/diva-admin/users/${s.user.id}`} className="flex items-center gap-1 text-xs text-[#D4AF37] hover:underline">
                    <Eye size={12} /> Review
                  </Link>
                </td>
              </tr>
            ))}
            {submissions.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-600">No pending KYC submissions</td></tr>}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
