import Link from "next/link";
import { CheckCircle, Package, Home } from "lucide-react";
import { db } from "@/lib/db";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; number?: string }>;
}) {
  const { id, number } = await searchParams;

  let order = null;
  if (id) {
    order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  const orderNumber = order?.orderNumber ?? number ?? "—";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed! 🎉</h1>
        <p className="text-gray-500 mb-6">
          Thank you! Your personalized gift is being crafted with love.
        </p>

        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-6">
          <p className="text-sm text-gray-500 mb-1">Order Number</p>
          <p className="text-2xl font-bold text-orange-500">{orderNumber}</p>
        </div>

        {order && (
          <div className="text-left mb-6 space-y-2">
            <p className="text-sm font-semibold text-gray-700 mb-3">Order Details</p>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm text-gray-600">
                <span>{item.productName} × {item.quantity}</span>
                <span className="font-medium">₹{Number(item.totalPrice)}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between text-sm font-bold text-gray-900">
              <span>Total Paid</span>
              <span>₹{Number(order.totalAmount)}</span>
            </div>
            <div className="flex items-center gap-2 pt-2 text-sm text-gray-500">
              <Package className="w-4 h-4 text-orange-500" />
              <span>Delivering to {order.city}, {order.state}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/products"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Package className="w-4 h-4" /> Shop More Gifts
          </Link>
          <Link
            href="/"
            className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-5">
          Order updates will be sent to your mobile/email.
        </p>
      </div>
    </div>
  );
}
