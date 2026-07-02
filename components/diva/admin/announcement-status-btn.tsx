"use client";

import { useState } from "react";
import { adminUpdateAnnouncement } from "@/actions/diva/community";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { DivaAnnouncementStatus } from "@prisma/client";

export function AnnouncementStatusBtn({ id, currentStatus }: { id: string; currentStatus: DivaAnnouncementStatus }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const publish = async () => {
    if (currentStatus === "PUBLISHED") return;
    setLoading(true);
    const res = await adminUpdateAnnouncement(id, { status: "PUBLISHED" });
    if (res.success) {
      toast.success("Published!");
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed");
    }
    setLoading(false);
  };

  const archive = async () => {
    setLoading(true);
    const res = await adminUpdateAnnouncement(id, { status: "ARCHIVED" });
    if (res.success) {
      toast.success("Archived");
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed");
    }
    setLoading(false);
  };

  if (currentStatus === "ARCHIVED") return null;

  return (
    <div className="flex gap-1 shrink-0">
      {currentStatus !== "PUBLISHED" && (
        <button
          onClick={publish}
          disabled={loading}
          className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 transition-colors disabled:opacity-50"
        >
          Publish
        </button>
      )}
      <button
        onClick={archive}
        disabled={loading}
        className="text-[10px] px-2 py-0.5 rounded-lg bg-white/5 text-white/30 hover:bg-white/10 transition-colors disabled:opacity-50"
      >
        Archive
      </button>
    </div>
  );
}
