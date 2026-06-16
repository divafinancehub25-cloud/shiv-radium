import { db } from "@/lib/db";
import { ShoppingBag, Package, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [totalOrders, pendingOrders, totalRevenue, recentOrders] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { status: "PENDING" } }),
    db.order.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: "PAID" } }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { items: { select: { productName: true } } },
    }),
  ]);

  const revenue = Number(totalRevenue._sum.totalAmount ?? 0);

  const stats = [
    { label: "Total Orders", value: totalOrders, icon: ShoppingBag, color: "text-blue-500 bg-blue-50" },
    { label: "Pending Orders", value: pendingOrders, icon: Clock, color: "text-orange-500 bg-orange-50" },
    { label: "Revenue (Paid)", value: `₹${revenue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-green-500 bg-green-50" },
    { label: "Products", value: await db.product.count(), icon: Package, color: "text-purple-500 bg-purple-50" },
  ];

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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-orange-500 hover:text-orange-600">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentOrders.length === 0 ? (
            <p className="text-center py-10 text-gray-400">No orders yet</p>
          ) : (
            recentOrders.map((order: typeof recentOrders[0]) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{order.orderNumber}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {order.customerName} · {order.items.map((i: { productName: string }) => i.productName).join(", ").slice(0, 40)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 text-sm">₹{Number(order.totalAmount).toLocaleString("en-IN")}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {order.status}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
