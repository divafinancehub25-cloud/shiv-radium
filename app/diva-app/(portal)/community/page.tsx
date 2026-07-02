"use client";

import { useState, useEffect } from "react";
import { getAnnouncements } from "@/actions/diva/community";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Search, Pin, Bookmark, BookmarkCheck, Megaphone } from "lucide-react";
import { toggleBookmark } from "@/actions/diva/community";
import { toast } from "sonner";
import type { AnnouncementRow, DivaAnnouncementCategory } from "@/types/diva/referral";

const CATEGORIES: { value: DivaAnnouncementCategory | "ALL"; label: string; emoji: string }[] = [
  { value: "ALL", label: "All", emoji: "📢" },
  { value: "UPDATES", label: "Updates", emoji: "🔔" },
  { value: "EVENTS", label: "Events", emoji: "🎉" },
  { value: "EDUCATION", label: "Education", emoji: "📚" },
  { value: "GENERAL", label: "General", emoji: "💬" },
];

const catColor: Record<string, string> = {
  UPDATES: "text-blue-400 bg-blue-400/10",
  EVENTS: "text-purple-400 bg-purple-400/10",
  EDUCATION: "text-emerald-400 bg-emerald-400/10",
  GENERAL: "text-white/50 bg-white/5",
};

function fmtDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CommunityPage() {
  const [category, setCategory] = useState<DivaAnnouncementCategory | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarking, setBookmarking] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getAnnouncements(
      category === "ALL" ? undefined : category,
      search.trim() || undefined
    ).then((res) => {
      setItems(res.data ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const handleBookmark = async (id: string) => {
    setBookmarking(id);
    const res = await toggleBookmark(id);
    if (res.success) {
      setItems((prev) => prev.map((a) => a.id === id ? { ...a, bookmarked: !a.bookmarked } : a));
      toast.success("Bookmark updated");
    }
    setBookmarking(null);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Community Center</h1>
          <p className="text-sm text-white/40 mt-1">Latest announcements and updates from STICKO</p>
        </div>
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
          <Megaphone className="w-4 h-4 text-[#D4AF37] ml-2" />
          <span className="text-xs text-white/40 pr-2">Live Feed</span>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5">
          <Search className="w-4 h-4 text-white/30 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-medium hover:bg-[#D4AF37]/30 transition-colors">
          Search
        </button>
      </form>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
              category === c.value
                ? "bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]"
                : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/70"
            }`}
          >
            <span>{c.emoji}</span> {c.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-white/40 text-sm">No announcements yet.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <GlassCard key={a.id} className={`p-5 ${a.isPinned ? "border border-[#D4AF37]/20" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {a.isPinned && (
                      <span className="flex items-center gap-1 text-[10px] text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full font-medium">
                        <Pin className="w-2.5 h-2.5" /> Pinned
                      </span>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${catColor[a.category] ?? "text-white/40 bg-white/5"}`}>
                      {a.category}
                    </span>
                    {a.publishedAt && (
                      <span className="text-[10px] text-white/30">{fmtDate(a.publishedAt)}</span>
                    )}
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-2 leading-snug">{a.title}</h3>
                  <p className="text-white/50 text-xs leading-relaxed line-clamp-3">{a.content}</p>
                  {a.authorName && (
                    <p className="text-white/20 text-[10px] mt-2">By {a.authorName}</p>
                  )}
                </div>
                <button
                  onClick={() => handleBookmark(a.id)}
                  disabled={bookmarking === a.id}
                  className="text-white/30 hover:text-[#D4AF37] transition-colors shrink-0 mt-0.5"
                >
                  {a.bookmarked
                    ? <BookmarkCheck className="w-4 h-4 text-[#D4AF37]" />
                    : <Bookmark className="w-4 h-4" />
                  }
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
