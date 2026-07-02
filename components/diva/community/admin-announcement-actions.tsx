"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { adminCreateAnnouncement } from "@/actions/diva/community";
import { toast } from "sonner";
import type { DivaAnnouncementCategory } from "@prisma/client";

const categories: DivaAnnouncementCategory[] = ["UPDATES", "EVENTS", "EDUCATION", "GENERAL"];

export function AdminAnnouncementActions() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ title: "", content: "", category: "GENERAL" as DivaAnnouncementCategory, isPinned: false, publishNow: true });

  const submit = () => {
    if (!form.title || !form.content) { toast.error("Title and content required"); return; }
    startTransition(async () => {
      const res = await adminCreateAnnouncement(form);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Announcement created!");
      setOpen(false);
      setForm({ title: "", content: "", category: "GENERAL", isPinned: false, publishNow: true });
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4" /> New Announcement
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-[#111] border border-white/10 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">New Announcement</h2>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Announcement title..."
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40"
            />
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Content..."
              rows={4}
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40 resize-none"
            />
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as DivaAnnouncementCategory }))}
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
            >
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))} className="accent-[#D4AF37]" />
                <span className="text-sm text-white/60">Pin announcement</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.publishNow} onChange={(e) => setForm((f) => ({ ...f, publishNow: e.target.checked }))} className="accent-[#D4AF37]" />
                <span className="text-sm text-white/60">Publish now</span>
              </label>
            </div>

            <button
              onClick={submit}
              disabled={pending}
              className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {pending ? "Creating..." : "Create Announcement"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
