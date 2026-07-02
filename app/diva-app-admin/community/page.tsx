import { adminGetAnnouncements } from "@/actions/diva/community";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Pin, Megaphone } from "lucide-react";
import { CreateAnnouncementForm } from "@/components/diva/admin/create-announcement-form";
import { AnnouncementStatusBtn } from "@/components/diva/admin/announcement-status-btn";

const statusColor: Record<string, string> = {
  DRAFT: "text-white/40 bg-white/5",
  PUBLISHED: "text-emerald-400 bg-emerald-400/10",
  SCHEDULED: "text-blue-400 bg-blue-400/10",
  ARCHIVED: "text-white/20 bg-white/[0.03]",
};

const catColor: Record<string, string> = {
  UPDATES: "text-blue-400 bg-blue-400/10",
  EVENTS: "text-purple-400 bg-purple-400/10",
  EDUCATION: "text-emerald-400 bg-emerald-400/10",
  GENERAL: "text-white/50 bg-white/5",
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AdminCommunityPage() {
  const res = await adminGetAnnouncements();
  const announcements = "data" in res ? (res.data ?? []) : [];
  const total = "total" in res ? res.total : 0;

  const published = announcements.filter((a: any) => a.status === "PUBLISHED").length;
  const drafts = announcements.filter((a: any) => a.status === "DRAFT").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Announcements</h1>
        <p className="text-sm text-white/40 mt-1">Manage community announcements for STICKO members</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: total, color: "text-white" },
          { label: "Published", value: published, color: "text-emerald-400" },
          { label: "Drafts", value: drafts, color: "text-yellow-400" },
        ].map((s) => (
          <GlassCard key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Announcements List */}
        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#D4AF37]" /> All Announcements
          </h2>
          {announcements.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">📢</p>
              <p className="text-white/40 text-sm">No announcements yet — create one</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {announcements.map((a: any) => (
                <div key={a.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.isPinned && <Pin className="w-3 h-3 text-[#D4AF37]" />}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${catColor[a.category] ?? "text-white/40 bg-white/5"}`}>
                        {a.category}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[a.status] ?? "text-white/40 bg-white/5"}`}>
                        {a.status}
                      </span>
                    </div>
                    <AnnouncementStatusBtn id={a.id} currentStatus={a.status} />
                  </div>
                  <p className="text-white text-sm font-medium mb-1 leading-snug">{a.title}</p>
                  <p className="text-white/40 text-xs line-clamp-2">{a.content}</p>
                  <p className="text-white/20 text-[10px] mt-2">
                    {a.authorName ?? "System"} · {fmtDate(a.publishedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Create Form */}
        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Create Announcement</h2>
          <CreateAnnouncementForm />
        </GlassCard>
      </div>
    </div>
  );
}
