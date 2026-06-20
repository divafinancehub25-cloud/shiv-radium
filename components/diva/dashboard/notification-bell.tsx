"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { getUserNotifications, markNotificationsRead } from "@/lib/diva/notifications";
import { GlassCard } from "@/components/diva/ui/glass-card";

type Notification = { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: Date; link?: string | null };

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notes.filter((n) => !n.isRead).length;

  async function load() {
    setLoading(true);
    const res = await getUserNotifications(""); // will use session server-side
    setNotes(res as any);
    setLoading(false);
  }

  useEffect(() => {
    if (open) { load(); }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleOpen() {
    setOpen(!open);
    if (!open && unread > 0) {
      await markNotificationsRead("");
      setNotes((n) => n.map((x) => ({ ...x, isRead: true })));
    }
  }

  const typeColor: Record<string, string> = { success: "text-emerald-400", error: "text-red-400", info: "text-blue-400" };

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen}
        className="relative rounded-xl p-2 text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300 transition-colors">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#D4AF37]" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute right-0 top-12 z-50 w-80"
          >
            <GlassCard className="overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <p className="text-white font-medium text-sm">Notifications</p>
                {unread > 0 && <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] rounded-full px-2 py-0.5">{unread} new</span>}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <p className="p-4 text-center text-white/30 text-xs">Loading…</p>
                ) : notes.length === 0 ? (
                  <p className="p-6 text-center text-white/30 text-xs">No notifications yet.</p>
                ) : (
                  notes.map((n) => (
                    <div key={n.id}
                      className={`px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${!n.isRead ? "bg-[#D4AF37]/[0.02]" : ""}`}>
                      <p className={`text-xs font-medium ${typeColor[n.type] ?? "text-white"}`}>{n.title}</p>
                      <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-white/20 text-[10px] mt-1">
                        {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
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
