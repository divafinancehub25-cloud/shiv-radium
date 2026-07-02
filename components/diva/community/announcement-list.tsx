"use client";

import { useState, useTransition } from "react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Bookmark, BookmarkCheck, Pin, Calendar, Tag } from "lucide-react";
import { toggleBookmark } from "@/actions/diva/community";
import { toast } from "sonner";
import type { AnnouncementRow, DivaAnnouncementCategory } from "@/types/diva/referral";
import { cn } from "@/lib/utils";

const categoryColors: Record<DivaAnnouncementCategory, string> = {
  UPDATES: "bg-blue-400/10 text-blue-400",
  EVENTS: "bg-purple-400/10 text-purple-400",
  EDUCATION: "bg-emerald-400/10 text-emerald-400",
  GENERAL: "bg-white/10 text-white/50",
};

const categoryLabels: Record<DivaAnnouncementCategory, string> = {
  UPDATES: "Updates",
  EVENTS: "Events",
  EDUCATION: "Education",
  GENERAL: "General",
};

export function AnnouncementList({ announcements, showBookmark = true }: { announcements: AnnouncementRow[]; showBookmark?: boolean }) {
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>(
    Object.fromEntries(announcements.map((a) => [a.id, a.bookmarked ?? false]))
  );
  const [, startTransition] = useTransition();

  const handleBookmark = (id: string) => {
    setBookmarks((prev) => ({ ...prev, [id]: !prev[id] }));
    startTransition(async () => {
      const res = await toggleBookmark(id);
      if (res.error) {
        setBookmarks((prev) => ({ ...prev, [id]: !prev[id] }));
        toast.error(res.error);
      } else {
        toast.success(bookmarks[id] ? "Bookmark removed" : "Bookmarked!");
      }
    });
  };

  if (!announcements.length) {
    return (
      <GlassCard className="p-8 text-center">
        <p className="text-white/20 text-sm">No announcements yet</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((a) => (
        <GlassCard key={a.id} className={cn("p-5 relative overflow-hidden", a.isPinned && "border-[#D4AF37]/20")}>
          {a.isPinned && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#D4AF37]/60 to-transparent" />
          )}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {a.isPinned && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full">
                    <Pin className="w-2.5 h-2.5" /> Pinned
                  </span>
                )}
                <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5", categoryColors[a.category])}>
                  <Tag className="w-2.5 h-2.5" /> {categoryLabels[a.category]}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{a.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed line-clamp-3">{a.content}</p>
              <div className="flex items-center gap-3 mt-3 text-[10px] text-white/30">
                {a.publishedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(a.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
                {a.authorName && <span>by {a.authorName}</span>}
              </div>
            </div>
            {showBookmark && (
              <button onClick={() => handleBookmark(a.id)} className="shrink-0 text-white/30 hover:text-[#D4AF37] transition-colors mt-1">
                {bookmarks[a.id] ? <BookmarkCheck className="w-4 h-4 text-[#D4AF37]" /> : <Bookmark className="w-4 h-4" />}
              </button>
            )}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
