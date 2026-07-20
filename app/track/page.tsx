"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";

type OrderItem = { id: string; productName: string; quantity: number; totalPrice: number };
type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  city: string;
  state: string;
  totalAmount: number;
  deliveryDate: string | null;
  createdAt: string;
  courierName?: string | null;
  trackingNumber?: string | null;
  items: OrderItem[];
};

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PROCESSING", "READY", "SHIPPED", "DELIVERED"];

const STATUS_INFO: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: "Order Placed", color: "text-yellow-600 bg-yellow-50", icon: Clock },
  CONFIRMED: { label: "Confirmed", color: "text-blue-600 bg-blue-50", icon: CheckCircle },
  PROCESSING: { label: "Being Made", color: "text-purple-600 bg-purple-50", icon: Package },
  READY: { label: "Ready to Ship", color: "text-indigo-600 bg-indigo-50", icon: Package },
  SHIPPED: { label: "Shipped", color: "text-cyan-600 bg-cyan-50", icon: Truck },
  DELIVERED: { label: "Delivered", color: "text-green-600 bg-green-50", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "text-red-600 bg-red-50", icon: XCircle },
  REFUNDED: { label: "Refunded", color: "text-gray-600 bg-gray-50", icon: XCircle },
};

export default function TrackOrderPage() {
  const [query, setQuery] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    if (!query.trim()) { setError("Order number daalo"); return; }
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch(`/api/track?order=${encodeURIComponent(query)}&phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (!res.ok || !data.order) throw new Error(data.error ?? "Order nahi mila");
      setOrder(data.order);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-orange-500">
            Shiv <span className="text-gray-900">Radium</span>
          </Link>
          <Link href="/products" className="text-sm text-gray-500 hover:text-orange-500">Shop</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-500">Order number aur mobile number se apna order track karo</p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Order Number *</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="e.g. SR-2025-001234"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number (optional)</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="10-digit mobile number"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && search()}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={search}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              ) : (
                <Search className="w-4 h-4" />
              )}
              Track Order
            </button>
          </div>
        </div>

        {/* Order Result */}
        {order && (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Order Number</p>
                  <p className="text-xl font-bold text-gray-900">{order.orderNumber}</p>
                </div>
                {STATUS_INFO[order.status] && (
                  <span className={`text-sm font-semibold px-4 py-2 rounded-full ${STATUS_INFO[order.status].color}`}>
                    {STATUS_INFO[order.status].label}
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {!["CANCELLED", "REFUNDED"].includes(order.status) && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    {STATUS_STEPS.map((step, i) => (
                      <div key={step} className="flex flex-col items-center flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-colors ${
                          i <= currentStep ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"
                        }`}>
                          {i < currentStep ? "✓" : i + 1}
                        </div>
                        <p className="text-[10px] text-center text-gray-400 leading-tight hidden md:block">
                          {STATUS_INFO[step]?.label}
                        </p>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`absolute h-0.5 w-full mt-4 ${i < currentStep ? "bg-orange-500" : "bg-gray-200"}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Customer</p>
                  <p className="font-medium text-gray-900">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Delivery To</p>
                  <p className="font-medium text-gray-900">{order.city}, {order.state}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Order Date</p>
                  <p className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Payment</p>
                  <p className={`font-medium ${order.paymentStatus === "PAID" ? "text-green-600" : "text-orange-600"}`}>
                    {order.paymentStatus}
                  </p>
                </div>
              </div>
            </div>

            {/* Shipment tracking */}
            {order.trackingNumber && (
              <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-5 h-5 text-cyan-600" />
                  <h3 className="font-semibold text-gray-900">Shipment Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {order.courierName && (
                    <div>
                      <p className="text-gray-400 text-xs">Courier Partner</p>
                      <p className="font-medium text-gray-900">{order.courierName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-400 text-xs">Tracking / AWB Number</p>
                    <p className="font-bold text-cyan-700">{order.trackingNumber}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Items Ordered</h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.productName} × {item.quantity}</span>
                    <span className="font-semibold text-gray-900">₹{Number(item.totalPrice)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>₹{Number(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
