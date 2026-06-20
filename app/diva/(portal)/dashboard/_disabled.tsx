import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileCard } from "@/components/diva/dashboard/profile-card";
import { StatsCard } from "@/components/diva/dashboard/stats-card";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { GoldButton } from "@/components/diva/ui/gold-button";
import { Wallet, TrendingUp, BarChart2, Shield, ArrowRight, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard | DIVA Growth Capital" };

export default async function DivaDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/diva/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { divaProfile: true, divaKYC: { select: { status: true } } },
  });
  if (!user) redirect("/diva/login");

  const accountStatus = user.divaProfile?.accountStatus ?? "PENDING_VERIFICATION";
  const kycStatus = user.divaKYC?.status ?? "PENDING";
  const kycApproved = kycStatus === "APPROVED";

  return (
    <div className="space-y-6">
      {!kycApproved && (
        <GlassCard className="border-[#D4AF37]/20 bg-[#D4AF37]/[0.03] p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-[#D4AF37]" />
              <div>
                <p className="text-sm font-medium text-white">Complete your KYC verification</p>
                <p className="text-xs text-zinc-500">Verify your identity to unlock all platform features.</p>
              </div>
            </div>
            <Link href="/diva/kyc">
              <GoldButton className="shrink-0 py-2 text-xs">Verify Now <ArrowRight size={12} /></GoldButton>
            </Link>
          </div>
        </GlassCard>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ProfileCard name={user.name} email={user.email} userId={user.id}
            accountStatus={accountStatus} kycStatus={kycStatus}
            referralCode={user.divaProfile?.referralCode} createdAt={user.createdAt} />
        </div>
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
          <StatsCard title="Total Portfolio" value="$0.00" icon={Wallet} delay={0.1} />
          <StatsCard title="Active Investments" value="0" icon={BarChart2} delay={0.15} />
          <StatsCard title="Available Balance" value="$0.00" icon={TrendingUp} delay={0.2} />
          <StatsCard title="KYC Status" value={kycApproved ? "Verified" : "Pending"} icon={Shield} delay={0.25} positive={kycApproved} />
        </div>
      </div>
      <GlassCard className="p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { href: "/diva/kyc", label: "KYC Verification", desc: "Complete identity verification", icon: Shield },
            { href: "/diva/profile", label: "View Profile", desc: "Manage your account details", icon: TrendingUp },
            { href: "/diva/settings", label: "Security Settings", desc: "Password & 2FA", icon: Wallet },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <GlassCard hover className="p-4 flex items-center gap-3 h-full">
                <div className="rounded-lg bg-[#D4AF37]/10 p-2">
                  <item.icon className="h-4 w-4 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
