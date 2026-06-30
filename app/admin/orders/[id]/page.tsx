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
        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} currentPayment={order.paymentStatus} />
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
                {/* Customization data */}
                <div className="bg-orange-50 rounded-xl p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(customData)
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k}>
                        <p className="text-xs text-gray-400 capitalize">{k.replace(/_/g, " ")}</p>
                        {v.startsWith("http") ? (
                          <div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={v} alt={k} className="w-20 h-20 object-cover rounded-lg border border-gray-200 mt-1" />
                            <a href={v} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-500 underline block mt-1">View Full</a>
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-gray-700">{v}</p>
                        )}
                      </div>
                    ))}
                </div>
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
