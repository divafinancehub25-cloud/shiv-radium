"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { AnnouncementRow } from "@/types/diva/referral";
import type { DivaAnnouncementCategory, DivaAnnouncementStatus } from "@prisma/client";

export async function getAnnouncements(
  category?: DivaAnnouncementCategory,
  search?: string
): Promise<{ data?: AnnouncementRow[]; error?: string }> {
  const session = await auth();
  const userId = session?.user?.id;

  const items = await prisma.divaAnnouncement.findMany({
    where: {
      status: "PUBLISHED",
      ...(category ? { category } : {}),
      ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" } }, { content: { contains: search, mode: "insensitive" } }] } : {}),
    },
    include: {
      author: { select: { name: true } },
      bookmarks: userId ? { where: { userId }, select: { id: true } } : false,
    },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
  });

  return {
    data: items.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      category: a.category,
      status: a.status,
      isPinned: a.isPinned,
      imageUrl: a.imageUrl,
      publishedAt: a.publishedAt?.toISOString() ?? null,
      authorName: a.author?.name ?? null,
      bookmarked: userId ? (a.bookmarks as { id: string }[]).length > 0 : false,
    })),
  };
}

export async function toggleBookmark(announcementId: string): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const userId = session.user.id;
  const existing = await prisma.divaAnnouncementBookmark.findUnique({
    where: { userId_announcementId: { userId, announcementId } },
  });

  if (existing) {
    await prisma.divaAnnouncementBookmark.delete({ where: { userId_announcementId: { userId, announcementId } } });
  } else {
    await prisma.divaAnnouncementBookmark.create({ data: { userId, announcementId } });
  }

  revalidatePath("/diva-app/community");
  return { success: true };
}

export async function getMyBookmarks(): Promise<{ data?: AnnouncementRow[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const bookmarks = await prisma.divaAnnouncementBookmark.findMany({
    where: { userId: session.user.id },
    include: {
      announcement: { include: { author: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: bookmarks
      .filter((b) => b.announcement.status === "PUBLISHED")
      .map((b) => ({
        id: b.announcement.id,
        title: b.announcement.title,
        content: b.announcement.content,
        category: b.announcement.category,
        status: b.announcement.status,
        isPinned: b.announcement.isPinned,
        imageUrl: b.announcement.imageUrl,
        publishedAt: b.announcement.publishedAt?.toISOString() ?? null,
        authorName: b.announcement.author?.name ?? null,
        bookmarked: true,
      })),
  };
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function adminCreateAnnouncement(data: {
  title: string;
  content: string;
  category: DivaAnnouncementCategory;
  isPinned?: boolean;
  imageUrl?: string;
  scheduledAt?: string;
  publishNow?: boolean;
}): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.divaAnnouncement.create({
    data: {
      title: data.title,
      content: data.content,
      category: data.category,
      isPinned: data.isPinned ?? false,
      imageUrl: data.imageUrl,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      status: data.publishNow ? "PUBLISHED" : data.scheduledAt ? "SCHEDULED" : "DRAFT",
      publishedAt: data.publishNow ? new Date() : undefined,
      createdBy: session.user.id,
    },
  });

  revalidatePath("/diva-app-admin/community");
  revalidatePath("/diva-app/community");
  return { success: true };
}

export async function adminUpdateAnnouncement(
  id: string,
  data: Partial<{ title: string; content: string; category: DivaAnnouncementCategory; isPinned: boolean; status: DivaAnnouncementStatus }>
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.divaAnnouncement.update({
    where: { id },
    data: {
      ...data,
      ...(data.status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
    },
  });

  revalidatePath("/diva-app-admin/community");
  revalidatePath("/diva-app/community");
  return { success: true };
}

export async function adminGetAnnouncements(page = 1) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const limit = 20;
  const [items, total] = await Promise.all([
    prisma.divaAnnouncement.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    }),
    prisma.divaAnnouncement.count(),
  ]);

  return {
    data: items.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      category: a.category,
      status: a.status,
      isPinned: a.isPinned,
      imageUrl: a.imageUrl,
      publishedAt: a.publishedAt?.toISOString() ?? null,
      authorName: a.author?.name ?? null,
    })),
    total,
    pages: Math.ceil(total / limit),
  };
}
