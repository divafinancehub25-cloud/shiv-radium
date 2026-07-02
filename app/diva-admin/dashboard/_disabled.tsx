import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Users, Shield, CheckCircle, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard | DIVA" };

export default async function DivaAdminDashboard() {
  const [totalUsers, pendingKYC, approvedKYC, underReview] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.divaKYCSubmission.count({ where: { status: "PENDING" } }),
    prisma.divaKYCSubmission.count({ where: { status: "APPROVED" } }),
    prisma.divaKYCSubmission.count({ where: { status: "UNDER_REVIEW" } }),
  ]);

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Pending KYC", value: pendingKYC, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Under Review", value: underReview, icon: Shield, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
    { label: "Approved KYC", value: approvedKYC, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <GlassCard key={s.label} hover className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">{s.label}</p>
                <p className="mt-1 text-3xl font-bold text-white">{s.value}</p>
              </div>
              <div className={`rounded-xl p-3 ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
