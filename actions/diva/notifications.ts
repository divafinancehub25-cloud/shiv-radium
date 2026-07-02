"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type NotificationType = "info" | "success" | "warning" | "deposit" | "withdrawal" | "kyc" | "referral" | "reward" | "achievement" | "announcement";

// ─── Create a notification (internal helper) ──────────────────────────────────

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}) {
  return prisma.divaNotification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type ?? "info",
      link: params.link ?? null,
    },
  });
}

// ─── Get my notifications ─────────────────────────────────────────────────────

export async function getMyNotifications(page = 1) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const limit = 20;
  const [items, total, unreadCount] = await Promise.all([
    prisma.divaNotification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.divaNotification.count({ where: { userId: session.user.id } }),
    prisma.divaNotification.count({ where: { userId: session.user.id, isRead: false } }),
  ]);

  return {
    data: items.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      link: n.link,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })),
    total,
    unreadCount,
    pages: Math.ceil(total / limit),
  };
}

// ─── Get unread count (for bell) ─────────────────────────────────────────────

export async function getUnreadCount() {
  const session = await auth();
  if (!session?.user?.id) return { count: 0 };
  const count = await prisma.divaNotification.count({
    where: { userId: session.user.id, isRead: false },
  });
  return { count };
}

// ─── Mark one as read ─────────────────────────────────────────────────────────

export async function markNotificationRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.divaNotification.updateMany({
    where: { id, userId: session.user.id },
    data: { isRead: true },
  });

  revalidatePath("/diva-app/notifications");
  return { success: true };
}

// ─── Mark all as read ────────────────────────────────────────────────────────

export async function markAllRead() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.divaNotification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/diva-app/notifications");
  return { success: true };
}

// ─── Delete one notification ──────────────────────────────────────────────────

export async function deleteNotification(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.divaNotification.deleteMany({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/diva-app/notifications");
  return { success: true };
}

// ─── Admin: broadcast to all users ───────────────────────────────────────────

export async function adminBroadcastNotification(data: {
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
  targetRole?: "ALL" | "CUSTOMER" | "ADMIN";
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const admin = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN")) return { error: "Forbidden" };

  const where = data.targetRole && data.targetRole !== "ALL"
    ? { role: data.targetRole as any }
    : {};

  const users = await prisma.user.findMany({ where, select: { id: true } });

  await prisma.divaNotification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      title: data.title,
      message: data.message,
      type: data.type ?? "info",
      link: data.link ?? null,
    })),
  });

  return { success: true, sent: users.length };
}

// ─── Admin: send to one user ──────────────────────────────────────────────────

export async function adminSendNotification(data: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const admin = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN")) return { error: "Forbidden" };

  await createNotification(data);
  return { success: true };
}

// ─── Admin: get all notifications (all users) ────────────────────────────────

export async function adminGetAllNotifications(page = 1) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const admin = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN")) return { error: "Forbidden" };

  const limit = 30;
  const [items, total] = await Promise.all([
    prisma.divaNotification.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.divaNotification.count(),
  ]);

  return {
    data: items.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
      userName: n.user.name,
      userEmail: n.user.email,
    })),
    total,
    pages: Math.ceil(total / limit),
  };
}
