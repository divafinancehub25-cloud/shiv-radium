"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema, changePasswordSchema } from "@/lib/diva/validators/profile";
import bcrypt from "bcryptjs";

async function getAuthUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function getMyProfile() {
  const userId = await getAuthUserId();
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      divaProfile: true,
      divaKYC: { include: { documents: true } },
    },
  });
}

export async function updateProfile(data: Record<string, unknown>) {
  const userId = await getAuthUserId();
  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, phone, ...profileFields } = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (name || phone) {
      await tx.user.update({ where: { id: userId }, data: { name, phone } });
    }
    if (Object.keys(profileFields).length > 0) {
      await tx.divaProfile.upsert({
        where: { userId },
        create: { userId, ...profileFields },
        update: profileFields,
      });
    }
  });

  return { success: true };
}

export async function changePassword(data: Record<string, unknown>) {
  const userId = await getAuthUserId();
  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) return { error: "Cannot change password" };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { error: "Current password is incorrect" };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return { success: true };
}
