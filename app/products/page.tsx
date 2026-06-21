import Link from "next/link";
import { db } from "@/lib/db";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "All Products" };

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { isActive: true },
      include: { category: { select: { name: true, slug: true, icon: true } } },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
    }),
    db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-orange-500">
            Shiv <span className="text-gray-900">Radium</span>
          </Link>
          <Link href="/cart" className="border border-gray-200 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Cart
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">All Products</h1>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link href="/products" className="px-4 py-1.5 rounded-full text-sm font-medium bg-orange-500 text-white">
            All
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="px-4 py-1.5 rounded-full text-sm font-medium border border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-500 transition-colors">
              {c.icon} {c.name}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all"
            >
              <div className="bg-gray-50 h-48 flex items-center justify-center text-5xl group-hover:bg-orange-50 transition-colors">
                {product.category.icon}
              </div>
              <div className="p-4">
                <p className="text-xs text-orange-500 font-medium mb-1">{product.category.name}</p>
                <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2 group-hover:text-orange-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-2 mb-3">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">₹{Number(product.basePrice)}</span>
                  <span className="text-xs text-gray-400">{product.deliveryDays}d delivery</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
