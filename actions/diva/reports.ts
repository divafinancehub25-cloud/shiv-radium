"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getGeneratedReports(page = 1) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const limit = 20;
  const [items, total] = await Promise.all([
    prisma.divaGeneratedReport.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { generator: { select: { name: true } } },
    }),
    prisma.divaGeneratedReport.count(),
  ]);

  return {
    data: items.map((r) => ({
      id: r.id,
      reportName: r.reportName,
      reportType: r.reportType,
      format: r.format,
      status: r.status,
      rowCount: r.rowCount,
      generatorName: r.generator?.name ?? "System",
      createdAt: r.createdAt.toISOString(),
      fileUrl: r.fileUrl,
    })),
    total, pages: Math.ceil(total / limit),
  };
}

// Generate CSV report and return as data URI
export async function generateReport(type: string, params?: { from?: string; to?: string }): Promise<{ data?: string; filename?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const from = params?.from ? new Date(params.from) : new Date(Date.now() - 30 * 86400000);
  const to = params?.to ? new Date(params.to) : new Date();
  let rows: string[][] = [];
  let headers: string[] = [];
  let filename = `sticko-${type}-${new Date().toISOString().slice(0, 10)}.csv`;

  if (type === "users") {
    headers = ["ID", "Name", "Email", "Role", "KYC Status", "Created At"];
    const users = await prisma.user.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { divaKYCSubmission: { select: { status: true } } },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    rows = users.map((u) => [u.id, u.name ?? "", u.email ?? "", u.role, u.divaKYCSubmission?.status ?? "NONE", u.createdAt.toISOString()]);
  } else if (type === "deposits") {
    headers = ["ID", "User ID", "Amount", "Coin", "Status", "TX Hash", "Created At"];
    const deps = await prisma.divaDeposit.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { user: { select: { email: true } }, wallet: { select: { coinType: true } } },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    rows = deps.map((d) => [d.id, d.user.email ?? "", String(d.amount), d.wallet?.coinType ?? "", d.status, d.txHash ?? "", d.createdAt.toISOString()]);
  } else if (type === "withdrawals") {
    headers = ["ID", "User Email", "Amount", "Network", "Status", "Created At"];
    const wds = await prisma.divaWithdrawal.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    rows = wds.map((w) => [w.id, w.user.email ?? "", String(w.amount), w.network, w.status, w.createdAt.toISOString()]);
  } else if (type === "referrals") {
    headers = ["ID", "Referrer Email", "Referred Email", "Status", "Referral Code", "Created At", "Activated At"];
    const refs = await prisma.divaReferral.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { referrer: { select: { email: true } }, referred: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    rows = refs.map((r) => [r.id, r.referrer.email ?? "", r.referred.email ?? "", r.status, r.referralCode ?? "", r.createdAt.toISOString(), r.activatedAt?.toISOString() ?? ""]);
  } else if (type === "audit") {
    headers = ["ID", "Action", "Entity", "Actor Email", "IP", "Created At"];
    const logs = await prisma.divaAuditLog.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { actor: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    rows = logs.map((l) => [l.id, l.action, l.entityType, l.actor?.email ?? "", l.ipAddress ?? "", l.createdAt.toISOString()]);
  } else if (type === "kyc") {
    headers = ["ID", "User Email", "Status", "Full Name", "Submitted At", "Reviewed At"];
    const kycs = await prisma.divaKYCSubmission.findMany({
      where: { updatedAt: { gte: from, lte: to } },
      include: { user: { select: { email: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });
    rows = kycs.map((k) => [k.id, k.user.email ?? "", k.status, k.fullName ?? "", k.submittedAt?.toISOString() ?? "", k.reviewedAt?.toISOString() ?? ""]);
  }

  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");

  // Record in DB
  await prisma.divaGeneratedReport.create({
    data: {
      reportName: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      reportType: type,
      format: "CSV",
      status: "COMPLETED",
      rowCount: rows.length,
      generatedBy: session.user.id,
      completedAt: new Date(),
    },
  });

  revalidatePath("/diva-app-admin/analytics/reports");
  return { data: csv, filename };
}
