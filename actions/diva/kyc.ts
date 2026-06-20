"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { kycStep1Schema } from "@/lib/diva/validators/kyc";
import { sendKYCStatusEmail } from "@/lib/diva/email";
import type { DivaDocumentType } from "@prisma/client";

async function getAuthUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function saveKYCStep1(data: {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
}) {
  const userId = await getAuthUserId();
  const parsed = kycStep1Schema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.divaKYCSubmission.upsert({
    where: { userId },
    create: {
      userId,
      status: "PENDING",
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      nationality: data.nationality,
      address: data.address,
    },
    update: {
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      nationality: data.nationality,
      address: data.address,
    },
  });

  return { success: true };
}

export async function saveKYCDocument(type: DivaDocumentType, url: string, fileName: string) {
  const userId = await getAuthUserId();

  const kyc = await prisma.divaKYCSubmission.upsert({
    where: { userId },
    create: { userId, status: "PENDING" },
    update: {},
  });

  // Replace existing doc of same type
  await prisma.divaKYCDocument.deleteMany({ where: { kycId: kyc.id, type } });
  await prisma.divaKYCDocument.create({
    data: { kycId: kyc.id, type, url, fileName },
  });

  return { success: true };
}

export async function submitKYC() {
  const userId = await getAuthUserId();

  const kyc = await prisma.divaKYCSubmission.findUnique({
    where: { userId },
    include: { documents: true },
  });
  if (!kyc) return { error: "Please complete all KYC steps first" };

  const hasSelfie = kyc.documents.some((d) => d.type === "SELFIE");
  const hasId = kyc.documents.some((d) => ["PASSPORT", "NATIONAL_ID", "DRIVING_LICENSE"].includes(d.type));
  if (!hasSelfie || !hasId) return { error: "Please upload all required documents" };

  await prisma.divaKYCSubmission.update({
    where: { id: kyc.id },
    data: { status: "PENDING", submittedAt: new Date() },
  });

  return { success: true };
}

export async function adminApproveKYC(kycId: string, adminId: string) {
  const kyc = await prisma.divaKYCSubmission.update({
    where: { id: kycId },
    data: { status: "APPROVED", reviewedBy: adminId, reviewedAt: new Date() },
    include: { user: true },
  });

  await prisma.divaProfile.update({
    where: { userId: kyc.userId },
    data: { accountStatus: "ACTIVE" },
  });

  await sendKYCStatusEmail(kyc.user.email ?? "", kyc.user.name ?? "", "APPROVED");

  return { success: true };
}

export async function adminRejectKYC(kycId: string, adminId: string, notes: string) {
  const kyc = await prisma.divaKYCSubmission.update({
    where: { id: kycId },
    data: { status: "REJECTED", adminNotes: notes, reviewedBy: adminId, reviewedAt: new Date() },
    include: { user: true },
  });

  await sendKYCStatusEmail(kyc.user.email ?? "", kyc.user.name ?? "", "REJECTED", notes);

  return { success: true };
}

export async function getMyKYC() {
  const userId = await getAuthUserId();
  return prisma.divaKYCSubmission.findUnique({
    where: { userId },
    include: { documents: true },
  });
}
