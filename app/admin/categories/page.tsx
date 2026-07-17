import { db } from "@/lib/db";
import Link from "next/link";
import { Plus } from "lucide-react";
import DeleteButton from "../DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Link href="/admin/categories/new" className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add Category
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Category</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Slug</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Products</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {categories.map((cat: typeof categories[0]) => (
              <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <span className="text-2xl mr-2">{cat.icon}</span>
                  <span className="font-medium text-gray-900">{cat.name}</span>
                </td>
                <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">{cat.slug}</td>
                <td className="px-5 py-3.5 text-gray-500">{cat._count.products} products</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {cat.isActive ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/categories/${cat.id}`} className="text-sm text-orange-500 hover:text-orange-600">Edit</Link>
                    <DeleteButton
                      url={`/api/admin/categories/${cat.id}`}
                      confirmText={`"${cat.name}" category delete karni hai?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
