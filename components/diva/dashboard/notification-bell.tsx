"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { getMyNotifications, markNotificationRead, markAllRead } from "@/actions/diva/notifications";
import { GlassCard } from "@/components/diva/ui/glass-card";
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

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const res = await getMyNotifications(1);
    if ("data" in res) { setItems(res.data ?? []); setUnread(res.unreadCount ?? 0); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleRead = async (id: string) => {
    await markNotificationRead(id);
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnread((c) => Math.max(0, c - 1));
  };

  const handleMarkAll = async () => {
    await markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open) load(); }}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
      >
        <Bell className="h-4 w-4 text-white/60" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[9px] font-bold text-black">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute right-0 top-11 z-50 w-80"
          >
            <GlassCard className="overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <p className="text-sm font-semibold text-white">Notifications</p>
                <div className="flex items-center gap-3">
                  {unread > 0 && (
                    <button onClick={handleMarkAll} className="text-[10px] text-[#D4AF37] hover:underline">Mark all read</button>
                  )}
                  <Link href="/diva-app/notifications" onClick={() => setOpen(false)} className="text-[10px] text-white/30 hover:text-white/60">See all</Link>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-2xl mb-2">🔔</p>
                    <p className="text-white/30 text-xs">No notifications yet</p>
                  </div>
                ) : (
                  items.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && handleRead(n.id)}
                      className={`flex gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 cursor-pointer hover:bg-white/[0.03] transition-colors ${!n.isRead ? "bg-[#D4AF37]/[0.03]" : ""}`}
                    >
                      <span className="text-base shrink-0 mt-0.5">{typeIcon[n.type] ?? "ℹ️"}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium leading-snug ${!n.isRead ? "text-white" : "text-white/50"}`}>{n.title}</p>
                        <p className="text-[10px] text-white/30 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[9px] text-white/20 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0 mt-1.5" />}
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
