import { db } from "@/lib/db";
import Link from "next/link";
import { Plus, Pencil, Upload } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    include: {
      category: { select: { name: true, icon: true } },
      _count: { select: { fields: true, orderItems: true } },
    },
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/products/bulk" className="flex items-center gap-2 border border-orange-500 text-orange-500 hover:bg-orange-50 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
            <Upload className="w-4 h-4" /> Bulk Upload
          </Link>
          <Link href="/admin/products/new" className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Product</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Category</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Price</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Fields</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Orders</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((product: typeof products[0]) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="font-medium text-gray-900">{product.name}</p>
                  {product.isFeatured && (
                    <span className="text-xs text-orange-500 font-medium">⭐ Featured</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-gray-500">
                  {product.category.icon} {product.category.name}
                </td>
                <td className="px-5 py-3.5 font-semibold text-gray-900">
                  ₹{Number(product.basePrice)}
                </td>
                <td className="px-5 py-3.5 text-gray-500">{product._count.fields} fields</td>
                <td className="px-5 py-3.5 text-gray-500">{product._count.orderItems}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {product.isActive ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <Link href={`/admin/products/${product.id}`} className="text-gray-400 hover:text-orange-500 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
