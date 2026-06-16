import { db } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  READY: "bg-indigo-100 text-indigo-700",
  SHIPPED: "bg-cyan-100 text-cyan-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-700",
};

const paymentColors: Record<string, string> = {
  PENDING: "text-yellow-600",
  PAID: "text-green-600",
  FAILED: "text-red-600",
  REFUNDED: "text-gray-600",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const orders = await db.order.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
    include: { items: { select: { productName: true, quantity: true } } },
  });

  const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "READY", "SHIPPED", "DELIVERED", "CANCELLED"];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <span className="text-sm text-gray-500">{orders.length} orders</span>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <Link href="/admin/orders" className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!status ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"}`}>
          All
        </Link>
        {statuses.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${status === s ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"}`}>
            {s}
          </Link>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {orders.length === 0 ? (
          <p className="text-center py-16 text-gray-400">No orders found</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Order</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Customer</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Items</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Payment</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order: typeof orders[0]) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-orange-500 hover:text-orange-600">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-800">{order.customerName}</p>
                    <p className="text-gray-400 text-xs">{order.customerPhone}</p>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 max-w-[180px]">
                    <p className="truncate">{order.items.map(i => `${i.productName} ×${i.quantity}`).join(", ")}</p>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900">
                    ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`font-medium text-xs ${paymentColors[order.paymentStatus] ?? "text-gray-600"}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
