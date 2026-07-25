"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "READY", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

export default function OrderStatusUpdater({
  orderId,
  currentStatus,
  currentPayment,
  currentCourier = "",
  currentTracking = "",
  currentGstNumber = "",
  currentGstRate = "",
  orderNumber,
}: {
  orderId: string;
  currentStatus: string;
  currentPayment: string;
  currentCourier?: string;
  currentTracking?: string;
  currentGstNumber?: string;
  currentGstRate?: string;
  orderNumber?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [payment, setPayment] = useState(currentPayment);
  const [courier, setCourier] = useState(currentCourier);
  const [tracking, setTracking] = useState(currentTracking);
  const [gstNumber, setGstNumber] = useState(currentGstNumber);
  const [gstRate, setGstRate] = useState(currentGstRate);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, paymentStatus: payment, courierName: courier, trackingNumber: tracking, gstNumber, gstRate }),
    });
    setSaving(false);
    router.refresh();
  }

  const changed = status !== currentStatus || payment !== currentPayment || courier !== currentCourier || tracking !== currentTracking || gstNumber !== currentGstNumber || gstRate !== currentGstRate;

  return (
    <div className="flex flex-col gap-2 items-end">
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
      </div>
      <div className="flex items-center gap-2">
        <input
          value={courier}
          onChange={(e) => setCourier(e.target.value)}
          placeholder="Courier (e.g. Delhivery)"
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="Tracking / AWB no."
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      {/* Optional GST — admin manually adds number + rate when customer needs it */}
      <div className="flex items-center gap-2">
        <input
          value={gstNumber}
          onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
          placeholder="Customer GSTIN (optional)"
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <input
          value={gstRate}
          onChange={(e) => setGstRate(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="GST %"
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      <div className="flex items-center gap-2">
        {orderNumber && (
          <a
            href={`/invoice/${orderNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            🧾 Invoice
          </a>
        )}
        {changed && (
          <button
            onClick={save}
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>
    </div>
  );
}
