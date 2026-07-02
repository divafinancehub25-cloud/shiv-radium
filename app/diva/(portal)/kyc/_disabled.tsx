import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { KYCWizard } from "@/components/diva/kyc/kyc-wizard";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { StatusBadge } from "@/components/diva/ui/status-badge";
import { CheckCircle, Clock, Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "KYC Verification | DIVA Growth Capital" };

export default async function KYCPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/diva/login");

  const kyc = await prisma.divaKYCSubmission.findUnique({
    where: { userId: session.user.id },
    include: { documents: true },
  });

  if (kyc?.submittedAt && kyc.status !== "REJECTED") {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <GlassCard className="p-8 text-center space-y-5">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${kyc.status === "APPROVED" ? "bg-emerald-500/20" : "bg-[#D4AF37]/20"}`}>
            {kyc.status === "APPROVED" ? <CheckCircle className="h-8 w-8 text-emerald-400" /> : <Clock className="h-8 w-8 text-[#D4AF37]" />}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{kyc.status === "APPROVED" ? "Verification Complete" : "Under Review"}</h2>
            <p className="mt-1 text-sm text-zinc-400">{kyc.status === "APPROVED" ? "Your identity has been verified successfully." : "Our compliance team is reviewing your submission."}</p>
          </div>
          <StatusBadge status={kyc.status} />
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-[#D4AF37]/10 p-2.5"><Shield className="h-5 w-5 text-[#D4AF37]" /></div>
        <div>
          <h1 className="text-xl font-bold text-white">KYC Verification</h1>
          <p className="text-sm text-zinc-500">Complete in 4 simple steps</p>
        </div>
      </div>
      {kyc?.status === "REJECTED" && kyc.adminNotes && (
        <GlassCard className="border-red-500/20 bg-red-500/[0.03] p-4">
          <p className="text-sm font-medium text-red-400">Previous submission rejected</p>
          <p className="mt-1 text-xs text-zinc-500">{kyc.adminNotes}</p>
        </GlassCard>
      )}
      <KYCWizard />
    </div>
  );
}
