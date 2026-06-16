"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "READY", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

export default function OrderStatusUpdater({
  orderId,
  currentStatus,
  currentPayment,
}: {
  orderId: string;
  currentStatus: string;
  currentPayment: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [payment, setPayment] = useState(currentPayment);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, paymentStatus: payment }),
    });
    setSaving(false);
    router.refresh();
  }

  const changed = status !== currentStatus || payment !== currentPayment;

  return (
    <div className="flex items-center gap-3">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
      >
        {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select
        value={payment}
        onChange={(e) => setPayment(e.target.value)}
        className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
      >
        {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      {changed && (
        <button
          onClick={save}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      )}
    </div>
  );
}
