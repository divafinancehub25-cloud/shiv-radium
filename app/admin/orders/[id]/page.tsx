import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import OrderStatusUpdater from "./OrderStatusUpdater";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  return (
    <div className="p-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-gray-500 text-sm mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} currentPayment={order.paymentStatus} currentCourier={order.courierName ?? ""} currentTracking={order.trackingNumber ?? ""} />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Customer info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Customer</h2>
          <div className="space-y-1.5 text-sm">
            <p className="font-medium text-gray-800">{order.customerName}</p>
            <p className="text-gray-500">{order.customerPhone}</p>
            {order.customerEmail && <p className="text-gray-500">{order.customerEmail}</p>}
          </div>
        </div>

        {/* Delivery info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Delivery Address</h2>
          <div className="text-sm text-gray-600 space-y-0.5">
            <p>{order.address}</p>
            <p>{order.city}, {order.state} - {order.pinCode}</p>
            {order.deliveryDate && (
              <p className="text-orange-500 font-medium mt-2">
                Requested by: {new Date(order.deliveryDate).toLocaleDateString("en-IN")}
              </p>
            )}
          </div>
        </div>

        {/* Payment summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Payment</h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{Number(order.subtotal)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Shipping</span><span>₹{Number(order.shippingCharge)}</span></div>
            {order.giftWrapping && <div className="flex justify-between text-gray-500"><span>Gift Wrap</span><span>₹49</span></div>}
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span><span>₹{Number(order.totalAmount)}</span>
            </div>
            <div className={`mt-2 inline-block text-xs px-2 py-1 rounded-full font-medium ${order.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {order.paymentStatus}
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="mt-5 bg-white rounded-2xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Order Items</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {order.items.map((item: { id: string; productName: string; quantity: number; unitPrice: unknown; totalPrice: unknown; customizationData: unknown }) => {
            const customData = item.customizationData as Record<string, string>;
            return (
              <div key={item.id} className="px-5 py-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-sm text-gray-400">Qty: {item.quantity} × ₹{Number(item.unitPrice)}</p>
                  </div>
                  <p className="font-bold text-gray-900">₹{Number(item.totalPrice)}</p>
                </div>
                {/* 🏭 Manufacturing summary — text to print + downloadable files */}
                {(() => {
                  const entries = Object.entries(customData).filter(([k, v]) => v && k !== "_layout");
                  const photoUrls: { label: string; url: string }[] = [];
                  const textFields: { label: string; value: string }[] = [];
                  for (const [k, v] of entries) {
                    if (v.startsWith("[")) {
                      try { const a = JSON.parse(v); if (Array.isArray(a)) a.forEach((u: string, i: number) => { if (typeof u === "string" && u.startsWith("http")) photoUrls.push({ label: `${k} ${i + 1}`, url: u }); }); continue; } catch {}
                    }
                    if (v.startsWith("http")) photoUrls.push({ label: k, url: v });
                    else if (!k.startsWith("_")) textFields.push({ label: k, value: v });
                  }
                  return (
                    <div className="bg-gray-900 text-white rounded-xl p-4 mb-3">
                      <p className="text-xs font-bold text-amber-300 mb-2 uppercase tracking-wide">🏭 Manufacturing Details</p>
                      {textFields.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[10px] text-gray-400 mb-1">Text to print / engrave:</p>
                          <div className="space-y-1">
                            {textFields.map((t) => (
                              <div key={t.label} className="flex items-baseline gap-2">
                                <span className="text-[10px] text-gray-400 capitalize shrink-0">{t.label.replace(/_/g, " ")}:</span>
                                <span className="text-sm font-semibold text-white break-all">{t.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {photoUrls.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-400 mb-1.5">Customer design files ({photoUrls.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {photoUrls.map((p, i) => (
                              <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" download className="group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.url} alt={p.label} className="w-20 h-20 object-cover rounded-lg border border-gray-700" />
                                <span className="block text-[10px] text-amber-300 text-center mt-0.5 group-hover:underline">⬇ Download</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {textFields.length === 0 && photoUrls.length === 0 && (
                        <p className="text-xs text-gray-400">Ready design (default) — koi custom input nahi</p>
                      )}
                    </div>
                  );
                })()}

                {/* Customization data */}
                <div className="bg-orange-50 rounded-xl p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(customData)
                    .filter(([k, v]) => v && k !== "_layout")
                    .map(([k, v]) => (
                      <div key={k}>
                        <p className="text-xs text-gray-400 capitalize">{k.replace(/_/g, " ")}</p>
                        {(() => {
                          // Multi-photo fields store a JSON array of URLs
                          let urls: string[] = [];
                          if (v.startsWith("[")) {
                            try { const a = JSON.parse(v); if (Array.isArray(a)) urls = a.filter((u: string) => typeof u === "string" && u.startsWith("http")); } catch {}
                          } else if (v.startsWith("http")) {
                            urls = [v];
                          }
                          if (urls.length > 0) {
                            return (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {urls.map((u, ui) => (
                                  <div key={ui}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={u} alt={`${k} ${ui + 1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                                    <a href={u} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-500 underline block mt-1">View Full</a>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return <p className="text-xs font-medium text-gray-700">{v}</p>;
                        })()}
                      </div>
                    ))}
                </div>
                {/* Customer-set design layout (drag positions/sizes) */}
                {customData._layout && (() => {
                  let parsed: Record<string, { x: number; y: number; size?: number; scale?: number }> = {};
                  try { parsed = JSON.parse(customData._layout); } catch { return null; }
                  return (
                    <div className="mt-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
                      <p className="text-xs font-semibold text-blue-700 mb-1.5">📐 Design Layout (customer ne set kiya)</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 text-xs text-gray-600">
                        {Object.entries(parsed).map(([k, l]) => (
                          <p key={k}>
                            <span className="capitalize font-medium">{k === "__photo" ? "Photo" : k.replace(/_/g, " ")}</span>:{" "}
                            {Math.round(l.x)}% / {Math.round(l.y)}%
                            {l.size ? `, ${l.size}px` : ""}
                            {l.scale ? `, zoom ${Math.round(l.scale * 100)}%` : ""}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>

      {/* Gift message */}
      {order.giftWrapping && order.giftMessage && (
        <div className="mt-5 bg-pink-50 border border-pink-100 rounded-2xl p-5">
          <p className="text-sm font-medium text-pink-700 mb-1">🎁 Gift Message</p>
          <p className="text-sm text-gray-700 italic">"{order.giftMessage}"</p>
        </div>
      )}
    </div>
  );
}
