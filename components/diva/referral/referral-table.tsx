"use client";

import type { ReferralRow } from "@/types/diva/referral";

const statusColors: Record<string, string> = {
  PENDING: "text-yellow-400 bg-yellow-400/10",
  CLICKED: "text-blue-400 bg-blue-400/10",
  REGISTERED: "text-purple-400 bg-purple-400/10",
  KYC_COMPLETED: "text-cyan-400 bg-cyan-400/10",
  ACTIVATED: "text-emerald-400 bg-emerald-400/10",
  EXPIRED: "text-red-400 bg-red-400/10",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  CLICKED: "Link Clicked",
  REGISTERED: "Registered",
  KYC_COMPLETED: "KYC Done",
  ACTIVATED: "Activated",
  EXPIRED: "Expired",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function ReferralTable({ referrals }: { referrals: ReferralRow[] }) {
  if (!referrals.length) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🤝</p>
        <p className="text-white/40 text-sm">No referrals yet — share your link to get started!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-left pb-3 text-xs text-white/30 font-medium">Member</th>
            <th className="text-left pb-3 text-xs text-white/30 font-medium">Status</th>
            <th className="text-left pb-3 text-xs text-white/30 font-medium hidden sm:table-cell">Invited On</th>
            <th className="text-left pb-3 text-xs text-white/30 font-medium hidden md:table-cell">Activated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {referrals.map((r) => (
            <tr key={r.id}>
              <td className="py-3 pr-4">
                <p className="text-white font-medium truncate max-w-[160px]">{r.referredName}</p>
                <p className="text-white/30 text-xs truncate max-w-[160px]">{r.referredEmail}</p>
              </td>
              <td className="py-3 pr-4">
                <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[r.status] ?? "text-white/40 bg-white/5"}`}>
                  {statusLabel[r.status] ?? r.status}
                </span>
              </td>
              <td className="py-3 pr-4 hidden sm:table-cell text-white/40 text-xs">{fmtDate(r.createdAt)}</td>
              <td className="py-3 hidden md:table-cell text-white/40 text-xs">{r.activatedAt ? fmtDate(r.activatedAt) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
