"use client";

import { useState } from "react";
import { adminCreateAnnouncement } from "@/actions/diva/community";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { DivaAnnouncementCategory } from "@prisma/client";

const CATEGORIES: DivaAnnouncementCategory[] = ["UPDATES", "EVENTS", "EDUCATION", "GENERAL"];

export function CreateAnnouncementForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", content: "",
    category: "GENERAL" as DivaAnnouncementCategory,
    isPinned: false, publishNow: true,
  });

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    setLoading(true);
    const res = await adminCreateAnnouncement(form);
    if (res.success) {
      toast.success(form.publishNow ? "Announcement published!" : "Saved as draft");
      setForm({ title: "", content: "", category: "GENERAL", isPinned: false, publishNow: true });
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed");
    }
    setLoading(false);
  };

  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#D4AF37]/50 transition-colors";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-xs text-white/40 block mb-1.5">Title *</label>
        <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Announcement title" className={inputCls} required />
      </div>
      <div>
        <label className="text-xs text-white/40 block mb-1.5">Content *</label>
        <textarea
          value={form.content}
          onChange={(e) => set("content", e.target.value)}
          placeholder="Write your announcement..."
          rows={5}
          className={inputCls + " resize-none"}
          required
        />
      </div>
      <div>
        <label className="text-xs text-white/40 block mb-1.5">Category</label>
        <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
          <input type="checkbox" checked={form.isPinned} onChange={(e) => set("isPinned", e.target.checked)}
            className="w-4 h-4 accent-[#D4AF37]" />
          Pin to top
        </label>
        <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
          <input type="checkbox" checked={form.publishNow} onChange={(e) => set("publishNow", e.target.checked)}
            className="w-4 h-4 accent-[#D4AF37]" />
          Publish now
        </label>
      </div>
      <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-50">
        {loading ? "Saving..." : form.publishNow ? "Publish" : "Save as Draft"}
      </button>
    </form>
  );
}
