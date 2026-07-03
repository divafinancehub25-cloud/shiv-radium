import Link from "next/link";
import { db } from "@/lib/db";
import { Search, Heart, ShoppingCart, Bell, Star } from "lucide-react";
import HeroBanner from "@/app/components/HeroBanner";
import FlashDeal from "@/app/components/FlashDeal";
import LocationBar from "@/app/components/LocationBar";
import BottomNav from "@/app/components/BottomNav";

export const dynamic = "force-dynamic";

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1 mt-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i <= Math.floor(rating) ? "fill-amber-400 text-amber-400" : i - 0.5 <= rating ? "fill-amber-200 text-amber-400" : "text-gray-200 fill-gray-200"}`}
          />
        ))}
      </div>
      <span className="text-[10px] text-gray-400">({count})</span>
    </div>
  );
}

export default async function HomePage() {
  const [categories, featuredProducts, settings] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: { category: { select: { name: true, slug: true, icon: true } } },
      orderBy: { sortOrder: "asc" },
      take: 8,
    }),
    db.setting.findMany({ where: { key: { in: ["store_logo", "store_name", "store_phone"] } } }),
  ]);

  const s: Record<string, string> = {};
  for (const row of settings) s[row.key] = row.value;
  const storeName = s.store_name ?? "Shiv Radium";
  const storeLogo = s.store_logo ?? null;

  // Static ratings for display (no rating field in DB)
  const productRatings = [4.5, 4.4, 4.3, 4.5, 4.2, 4.6, 4.1, 4.4];
  const productReviews = [128, 96, 74, 53, 89, 112, 67, 45];
  // Calculate fake MRP (~30-40% higher)
  const discountPct = [36, 36, 33, 33, 28, 40, 30, 35];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-lg mx-auto md:max-w-7xl px-3 py-3">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              {storeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={storeLogo} alt={storeName} className="h-10 w-auto object-contain" />
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-black text-sm">SR</span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-black text-gray-900 leading-tight">Shiv<br /><span className="text-orange-500">Radium</span></p>
                  </div>
                </div>
              )}
            </Link>

            {/* Search bar */}
            <Link href="/products" className="flex-1 flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5 hover:bg-orange-50 transition-colors group">
              <Search className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-gray-400 group-hover:text-orange-400 transition-colors">Search for products...</span>
            </Link>

            {/* Icons */}
            <div className="flex items-center gap-1">
              <Link href="/login" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <Heart className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-orange-500 rounded-full text-white text-[8px] flex items-center justify-center font-bold">2</span>
              </Link>
              <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-orange-500 rounded-full text-white text-[8px] flex items-center justify-center font-bold">5</span>
              </Link>
              <Link href="/track" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-orange-500 rounded-full text-white text-[8px] flex items-center justify-center font-bold">3</span>
              </Link>
            </div>
          </div>

          {/* Location bar */}
          <LocationBar />
        </div>
      </header>

      <div className="max-w-lg mx-auto md:max-w-7xl">
        {/* ── Hero Banner ── */}
        <HeroBanner />

        {/* ── Category Menu ── */}
        <div className="mt-5 px-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">Category Menu</h2>
            <Link href="/products" className="text-xs text-orange-500 font-semibold flex items-center gap-0.5">
              View All <span>›</span>
            </Link>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 bg-white border border-orange-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:border-orange-400 group-hover:bg-orange-50 transition-all group-hover:scale-105">
                  {cat.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cat.image} alt={cat.name} className="w-8 h-8 object-contain" />
                  ) : (
                    <span className="text-2xl">{cat.icon}</span>
                  )}
                </div>
                <span className="text-[10px] text-center text-gray-600 leading-tight font-medium group-hover:text-orange-500 transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
            {/* Fallback static categories if DB empty */}
            {categories.length === 0 && [
              { icon: "🖼️", name: "Photo Frames" },
              { icon: "💑", name: "Couple Gifts" },
              { icon: "👨‍👩‍👧", name: "Family Frames" },
              { icon: "🎁", name: "Gift Items" },
              { icon: "🪵", name: "Wooden Frames" },
              { icon: "💡", name: "LED Frames" },
              { icon: "🏆", name: "Awards" },
              { icon: "🖨️", name: "Customized Prints" },
            ].map((c) => (
              <Link key={c.name} href="/products" className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 bg-white border border-orange-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:border-orange-400 transition-all">
                  <span className="text-2xl">{c.icon}</span>
                </div>
                <span className="text-[10px] text-center text-gray-600 leading-tight font-medium">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Flash Deal + Our Story ── */}
        <FlashDeal />

        {/* ── Featured Products ── */}
        {featuredProducts.length > 0 && (
          <div className="mt-5 px-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900">Featured Products</h2>
              <Link href="/products" className="text-xs text-orange-500 font-semibold flex items-center gap-0.5">
                View All <span>›</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {featuredProducts.map((product, idx) => {
                const rating = productRatings[idx % productRatings.length];
                const count = productReviews[idx % productReviews.length];
                const disc = discountPct[idx % discountPct.length];
                const price = Number(product.basePrice);
                const mrp = Math.round(price / (1 - disc / 100));
                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border border-gray-100"
                  >
                    <div className="relative h-44 bg-gray-50 overflow-hidden">
                      {product.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">
                          {product.category.icon}
                        </div>
                      )}
                      {/* Wishlist */}
                      <button className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center">
                        <Heart className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">{product.name}</p>
                      <StarRating rating={rating} count={count} />
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">₹{price.toLocaleString("en-IN")}</span>
                        <span className="text-xs text-gray-400 line-through">₹{mrp.toLocaleString("en-IN")}</span>
                        <span className="text-[10px] font-bold text-orange-500">{disc}% OFF</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── How It Works ── */}
        <div className="mt-6 mx-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 mb-4 text-center">How It Works</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { icon: "🎨", step: "01", title: "Choose & Customize" },
              { icon: "🛒", step: "02", title: "Place Order" },
              { icon: "🚚", step: "03", title: "Get Delivered" },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl">
                  {s.icon}
                </div>
                <p className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">Step {s.step}</p>
                <p className="text-xs font-semibold text-gray-700 leading-tight">{s.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Testimonials ── */}
        <div className="mt-4 mx-3">
          <h2 className="text-sm font-bold text-gray-900 mb-3">What Customers Say</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { name: "Priya Sharma", city: "Delhi", rating: 5, text: "Quality amazing! Super fast delivery. Will order again!", initial: "P" },
              { name: "Rahul Verma", city: "Mumbai", rating: 5, text: "Live customizer is so cool! Parents loved the gift!", initial: "R" },
              { name: "Anita Singh", city: "Bangalore", rating: 5, text: "Perfect photo frame for anniversary. Highly recommended!", initial: "A" },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 min-w-[220px]">
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{t.name}</p>
                    <p className="text-[9px] text-gray-400">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="mt-4 mx-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-center">
          <p className="text-white font-bold text-base">Create Something Special</p>
          <p className="text-orange-100 text-xs mt-1 mb-4">Design your perfect personalized gift today</p>
          <Link
            href="/products"
            className="inline-block bg-white text-orange-500 font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-orange-50 transition-colors"
          >
            Start Customizing →
          </Link>
        </div>

        {/* ── Footer ── */}
        <footer className="mt-6 bg-gray-900 text-gray-400 py-8 px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-white font-bold mb-2">Shiv Radium</p>
              <p className="text-xs leading-relaxed">Personalized gifts crafted with love for every occasion.</p>
              <div className="flex gap-2 mt-3">
                <a href="#" className="w-7 h-7 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-orange-500 transition-colors text-[10px] font-bold">IG</a>
                <a href="#" className="w-7 h-7 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-orange-500 transition-colors text-[10px] font-bold">FB</a>
              </div>
            </div>
            <div>
              <p className="text-white text-xs font-semibold mb-2">Quick Links</p>
              <div className="space-y-1.5 text-xs">
                <Link href="/products" className="block hover:text-orange-400">All Products</Link>
                <Link href="/track" className="block hover:text-orange-400">Track Order</Link>
                <Link href="/login" className="block hover:text-orange-400">Login</Link>
                <Link href="/cart" className="block hover:text-orange-400">Cart</Link>
              </div>
            </div>
            <div>
              <p className="text-white text-xs font-semibold mb-2">Categories</p>
              <div className="space-y-1.5 text-xs">
                {categories.slice(0, 5).map((c) => (
                  <Link key={c.id} href={`/category/${c.slug}`} className="block hover:text-orange-400">{c.name}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white text-xs font-semibold mb-2">Contact</p>
              <div className="space-y-1.5 text-xs">
                <p>📞 +91 98765 43210</p>
                <p>✉️ orders@shivradium.com</p>
                <p>🚚 Pan India Delivery</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-4 text-center text-xs text-gray-600">
            © 2025 Shiv Radium. All rights reserved. | Made with ❤️ in India
          </div>
        </footer>
      </div>

      {/* ── Bottom Nav (mobile only) ── */}
      <BottomNav />
    </div>
  );
}
