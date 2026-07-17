"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export default function DeleteButton({ url, confirmText }: { url: string; confirmText: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm(confirmText)) return;
    setBusy(true);
    const res = await fetch(url, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (data.message) alert(data.message);
    else if (!res.ok) alert(data.error ?? "Delete failed");
    router.refresh();
  }

  return (
    <button onClick={handleDelete} disabled={busy} title="Delete" className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
