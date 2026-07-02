"use client";

import { useState, useEffect } from "react";
import { adminBroadcastNotification, adminSendNotification, adminGetAllNotifications } from "@/actions/diva/notifications";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Send, Radio, Bell } from "lucide-react";
import { toast } from "sonner";

const TYPES = ["info", "success", "warning", "deposit", "withdrawal", "kyc", "referral", "reward", "achievement", "announcement"] as const;
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

export default function AdminNotificationsPage() {
  const [tab, setTab] = useState<"broadcast" | "direct" | "history">("broadcast");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [histTotal, setHistTotal] = useState(0);
  const [histLoading, setHistLoading] = useState(false);

  // Broadcast form
  const [bForm, setBForm] = useState({ title: "", message: "", type: "info", link: "", targetRole: "ALL" as "ALL" | "CUSTOMER" | "ADMIN" });

  // Direct form
  const [dForm, setDForm] = useState({ userId: "", title: "", message: "", type: "info", link: "" });

  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50 transition-colors placeholder:text-white/20";
  const selectCls = inputCls + " cursor-pointer";

  const loadHistory = (p = 1) => {
    setHistLoading(true);
    adminGetAllNotifications(p).then((res) => {
      if ("data" in res) { setHistory(res.data ?? []); setHistTotal(res.total ?? 0); }
      setHistLoading(false);
    });
  };

  useEffect(() => { if (tab === "history") loadHistory(); }, [tab]);

  const sendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bForm.title || !bForm.message) return toast.error("Title and message required");
    setLoading(true);
    const res = await adminBroadcastNotification({ ...bForm, type: bForm.type as any });
    if (res.success) { toast.success(`Sent to ${res.sent} users!`); setBForm({ title: "", message: "", type: "info", link: "", targetRole: "ALL" }); loadHistory(); }
    else toast.error(res.error ?? "Failed");
    setLoading(false);
  };

  const sendDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dForm.userId || !dForm.title || !dForm.message) return toast.error("User ID, title and message required");
    setLoading(true);
    const res = await adminSendNotification({ ...dForm, type: dForm.type as any });
    if (res.success) { toast.success("Notification sent!"); setDForm({ userId: "", title: "", message: "", type: "info", link: "" }); }
    else toast.error(res.error ?? "Failed");
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Notification Center</h1>
        <p className="text-sm text-white/40 mt-1">Send and manage platform notifications</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 w-fit">
        {([
          { key: "broadcast", label: "Broadcast", icon: Radio },
          { key: "direct", label: "Direct Send", icon: Send },
          { key: "history", label: "History", icon: Bell },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t.key ? "bg-[#D4AF37] text-black" : "text-white/40 hover:text-white/70"}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Broadcast */}
      {tab === "broadcast" && (
        <GlassCard className="p-6">
          <p className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#D4AF37]" /> Broadcast to All Users
          </p>
          <form onSubmit={sendBroadcast} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 block mb-1.5">Type</label>
                <select value={bForm.type} onChange={(e) => setBForm({ ...bForm, type: e.target.value })} className={selectCls}>
                  {TYPES.map((t) => <option key={t} value={t} className="bg-[#111]">{typeIcon[t]} {t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1.5">Target Audience</label>
                <select value={bForm.targetRole} onChange={(e) => setBForm({ ...bForm, targetRole: e.target.value as any })} className={selectCls}>
                  <option value="ALL" className="bg-[#111]">All Users</option>
                  <option value="CUSTOMER" className="bg-[#111]">Customers Only</option>
                  <option value="ADMIN" className="bg-[#111]">Admins Only</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1.5">Title *</label>
              <input value={bForm.title} onChange={(e) => setBForm({ ...bForm, title: e.target.value })} placeholder="Notification title" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1.5">Message *</label>
              <textarea value={bForm.message} onChange={(e) => setBForm({ ...bForm, message: e.target.value })} placeholder="Notification body..." rows={3} className={inputCls + " resize-none"} />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1.5">Link (optional)</label>
              <input value={bForm.link} onChange={(e) => setBForm({ ...bForm, link: e.target.value })} placeholder="/diva-app/deposits" className={inputCls} />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              <Radio className="w-4 h-4" /> {loading ? "Sending..." : "Send Broadcast"}
            </button>
          </form>
        </GlassCard>
      )}

      {/* Direct */}
      {tab === "direct" && (
        <GlassCard className="p-6">
          <p className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
            <Send className="w-4 h-4 text-[#D4AF37]" /> Send to Specific User
          </p>
          <form onSubmit={sendDirect} className="space-y-4">
            <div>
              <label className="text-xs text-white/40 block mb-1.5">User ID *</label>
              <input value={dForm.userId} onChange={(e) => setDForm({ ...dForm, userId: e.target.value })} placeholder="Paste user ID from Members page" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 block mb-1.5">Type</label>
                <select value={dForm.type} onChange={(e) => setDForm({ ...dForm, type: e.target.value })} className={selectCls}>
                  {TYPES.map((t) => <option key={t} value={t} className="bg-[#111]">{typeIcon[t]} {t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1.5">Link (optional)</label>
                <input value={dForm.link} onChange={(e) => setDForm({ ...dForm, link: e.target.value })} placeholder="/diva-app/deposits" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1.5">Title *</label>
              <input value={dForm.title} onChange={(e) => setDForm({ ...dForm, title: e.target.value })} placeholder="Notification title" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1.5">Message *</label>
              <textarea value={dForm.message} onChange={(e) => setDForm({ ...dForm, message: e.target.value })} placeholder="Notification body..." rows={3} className={inputCls + " resize-none"} />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> {loading ? "Sending..." : "Send Notification"}
            </button>
          </form>
        </GlassCard>
      )}

      {/* History */}
      {tab === "history" && (
        <GlassCard className="p-6">
          <p className="text-sm font-semibold text-white mb-5">All Notifications ({histTotal})</p>
          {histLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-white/30 text-sm py-10">No notifications sent yet</p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {history.map((n) => (
                <div key={n.id} className="flex gap-3 py-3">
                  <span className="text-base shrink-0">{typeIcon[n.type] ?? "ℹ️"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium">{n.title}</p>
                    <p className="text-white/30 text-[10px] mt-0.5">{n.message}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] text-white/20">{n.userName} · {n.userEmail}</p>
                      <p className="text-[10px] text-white/20">{timeAgo(n.createdAt)}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${n.isRead ? "bg-white/10 text-white/30" : "bg-[#D4AF37]/10 text-[#D4AF37]"}`}>
                        {n.isRead ? "Read" : "Unread"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
