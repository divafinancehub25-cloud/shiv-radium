"use server";
import { prisma } from "@/lib/prisma";

export async function createNotification({
  userId,
  title,
  message,
  type = "info",
  link,
}: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}) {
  try {
    await prisma.divaNotification.create({ data: { userId, title, message, type, link } });
  } catch {
    // non-critical
  }
}

export async function getUserNotifications(userId: string) {
  return prisma.divaNotification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationsRead(userId: string) {
  await prisma.divaNotification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { success: true };
}
