import Link from "next/link";
import { db } from "@/lib/db";
import { ShoppingBag, Star, Truck, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featuredProducts] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { sortOrder: "asc" },
      take: 8,
    }),
  ]);

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-orange-500">
            Shiv <span className="text-gray-900">Radium</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/products" className="hover:text-orange-500 transition-colors">All Products</Link>
            {categories.slice(0, 4).map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`} className="hover:text-orange-500 transition-colors">
                {c.name.split(" ")[0]}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ShoppingBag className="w-5 h-5" />
            </Link>
            <Link href="/login" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-50 to-amber-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-orange-500 font-medium text-sm uppercase tracking-wider mb-3">
            Personalized Gifting
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight">
            Gifts that speak<br />
            <span className="text-orange-500">from the heart</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto mb-8">
            Photo frames, mugs, name boards, corporate gifts — customized just the way you want. Pan India delivery.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/products" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-orange-200">
              Shop Now
            </Link>
            <Link href="/category/photo-gifts" className="border-2 border-orange-500 text-orange-500 hover:bg-orange-50 font-semibold px-8 py-3 rounded-xl transition-colors">
              Photo Gifts
            </Link>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-orange-500" /> Pan India Delivery</div>
            <div className="flex items-center gap-2"><Star className="w-4 h-4 text-orange-500" /> 4.9★ Rating</div>
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-orange-500" /> 100% Satisfaction</div>
            <div className="flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-orange-500" /> 10,000+ Orders</div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex flex-col items-center gap-3 p-5 border-2 border-gray-100 rounded-2xl hover:border-orange-400 hover:bg-orange-50 transition-all"
            >
              <span className="text-4xl">{cat.icon}</span>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600 text-center leading-tight">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-8 pb-16 max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          <Link href="/products" className="text-orange-500 hover:text-orange-600 text-sm font-medium">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {featuredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all"
            >
              <div className="bg-gray-50 h-48 flex items-center justify-center overflow-hidden group-hover:bg-orange-50 transition-colors">
                {product.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl">🎁</span>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs text-orange-500 font-medium mb-1">{product.category.name}</p>
                <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2 group-hover:text-orange-600 transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">₹{Number(product.basePrice)}</span>
                  <span className="text-xs text-gray-500">{product.deliveryDays}d delivery</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-white font-bold text-xl mb-2">Shiv Radium</p>
          <p className="text-sm mb-4">Personalized gifts for every occasion</p>
          <p className="text-xs text-gray-600">© 2025 Shiv Radium. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
