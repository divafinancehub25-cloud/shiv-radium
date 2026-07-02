"use client";

import { useState, useEffect } from "react";
import { getMyNotifications, markNotificationRead, markAllRead, deleteNotification } from "@/actions/diva/notifications";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import Link from "next/link";

const typeIcon: Record<string, string> = {
  deposit: "💰", withdrawal: "💸", kyc: "🪪", referral: "🔗",
  reward: "🎁", achievement: "🏆", announcement: "📢",
  success: "✅", warning: "⚠️", info: "ℹ️",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = (p = 1) => {
    setLoading(true);
    getMyNotifications(p).then((res) => {
      if ("data" in res) {
        setItems(res.data ?? []);
        setUnread(res.unreadCount ?? 0);
        setTotal(res.total ?? 0);
        setPages(res.pages ?? 1);
        setPage(p);
      }
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleRead = async (id: string) => {
    await markNotificationRead(id);
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnread((c) => Math.max(0, c - 1));
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    setItems((prev) => prev.filter((n) => n.id !== id));
    setTotal((c) => c - 1);
  };

  const handleMarkAll = async () => {
    await markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const displayed = filter === "unread" ? items.filter((n) => !n.isRead) : items;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-white/40 mt-1">{total} total · {unread} unread</p>
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAll} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-sm font-medium hover:bg-[#D4AF37]/25 transition-colors">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 w-fit">
        {(["all", "unread"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filter === f ? "bg-[#D4AF37] text-black" : "text-white/40 hover:text-white/70"}`}>
            {f} {f === "unread" && unread > 0 ? `(${unread})` : ""}
          </button>
        ))}
      </div>

      <GlassCard className="divide-y divide-white/[0.04] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No {filter === "unread" ? "unread " : ""}notifications</p>
          </div>
        ) : (
          displayed.map((n) => (
            <div
              key={n.id}
              className={`flex gap-4 px-5 py-4 transition-colors ${!n.isRead ? "bg-[#D4AF37]/[0.03]" : ""}`}
            >
              <span className="text-xl shrink-0 mt-0.5">{typeIcon[n.type] ?? "ℹ️"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium leading-snug ${!n.isRead ? "text-white" : "text-white/50"}`}>{n.title}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!n.isRead && (
                      <button onClick={() => handleRead(n.id)} title="Mark read" className="p-1 rounded hover:bg-white/[0.06] transition-colors">
                        <CheckCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(n.id)} title="Delete" className="p-1 rounded hover:bg-white/[0.06] transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-white/20 hover:text-red-400" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-white/40 mt-1 leading-relaxed">{n.message}</p>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-[10px] text-white/20">{timeAgo(n.createdAt)}</p>
                  {n.link && (
                    <Link href={n.link} className="text-[10px] text-[#D4AF37] hover:underline">View →</Link>
                  )}
                  {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />}
                </div>
              </div>
            </div>
          ))
        )}
      </GlassCard>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/30">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => load(page - 1)} className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.04] text-white/40 disabled:opacity-30 hover:bg-white/[0.08]">Prev</button>
            <button disabled={page >= pages} onClick={() => load(page + 1)} className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.04] text-white/40 disabled:opacity-30 hover:bg-white/[0.08]">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
