"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/diva/validators/auth";
import { generateSecureToken } from "@/lib/diva/tokens";
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/diva/email";
import type { RegisterInput } from "@/lib/diva/validators/auth";

function generateReferralCode() {
  return "DIVA" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function registerUser(data: RegisterInput) {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, phone, country, password, referralCode } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
  });
  if (existing) {
    if (existing.email === email) return { error: "An account with this email already exists" };
    return { error: "An account with this phone number already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const verifyToken = generateSecureToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  // Resolve referral
  let referredByUserId: string | undefined;
  if (referralCode) {
    const refProfile = await prisma.divaProfile.findUnique({ where: { referralCode } });
    if (refProfile) referredByUserId = refProfile.userId;
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: "CUSTOMER",
      isActive: true,
      divaProfile: {
        create: {
          country,
          accountStatus: "PENDING_VERIFICATION",
          referralCode: generateReferralCode(),
          referredBy: referredByUserId,
        },
      },
      divaEmailTokens: {
        create: {
          token: verifyToken,
          expiresAt,
        },
      },
    },
  });

  // Create referral record
  if (referredByUserId) {
    await prisma.divaReferral.create({
      data: { referrerId: referredByUserId, referredId: user.id },
    });
  }

  try {
    await sendVerificationEmail(email, name, verifyToken);
  } catch {
    // Email failure is non-critical — user can request re-send later
  }

  return { success: true, userId: user.id };
}

export async function verifyEmail(token: string) {
  const record = await prisma.divaEmailVerifyToken.findUnique({ where: { token } });
  if (!record) return { error: "Invalid verification link" };
  if (record.usedAt) return { error: "This link has already been used" };
  if (record.expiresAt < new Date()) return { error: "Verification link has expired" };

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.divaEmailVerifyToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  try {
    await sendWelcomeEmail(user.email ?? "", user.name ?? "Member");
  } catch {
    // non-critical
  }

  return { success: true };
}

export async function forgotPassword(data: { email: string }) {
  const parsed = forgotPasswordSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.data };

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  // Always return success to prevent email enumeration
  if (!user) return { success: true };

  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await prisma.divaPasswordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  try {
    await sendPasswordResetEmail(user.email ?? "", user.name ?? "", token);
  } catch {
    // non-critical
  }

  return { success: true };
}

export async function resetPassword(data: { token: string; password: string; confirmPassword: string }) {
  const parsed = resetPasswordSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const record = await prisma.divaPasswordResetToken.findUnique({ where: { token: data.token } });
  if (!record) return { error: "Invalid or expired reset link" };
  if (record.usedAt) return { error: "This reset link has already been used" };
  if (record.expiresAt < new Date()) return { error: "Reset link has expired" };

  const passwordHash = await bcrypt.hash(data.password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.divaPasswordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: true };
}
