import Link from "next/link";
import { db } from "@/lib/db";
import { Search, Heart, ShoppingCart, Bell, Star } from "lucide-react";
import HeroBanner from "@/app/components/HeroBanner";
import FlashDeal from "@/app/components/FlashDeal";
import LocationBar from "@/app/components/LocationBar";
import BottomNav from "@/app/components/BottomNav";
import { getStorefrontConfig } from "@/lib/storefront";
import LikeButton from "@/components/LikeButton";

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
  const [categories, featuredProducts, config] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    // Featured products first, then the rest (admin's Featured toggle drives order)
    db.product.findMany({
      where: { isActive: true },
      include: { category: { select: { name: true, slug: true, icon: true } } },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      take: 8,
    }),
    getStorefrontConfig(),
  ]);

  const { storeName, storeLogo, storePhone, storeEmail, homepage, theme } = config;
  const brand = theme.primary;

  // Static ratings for display (no rating field in DB)
  const productRatings = [4.5, 4.4, 4.3, 4.5, 4.2, 4.6, 4.1, 4.4];
  const productReviews = [128, 96, 74, 53, 89, 112, 67, 45];

  // Category tile style from admin theme settings
  const catSizeCls = { sm: "w-11 h-11 md:w-12 md:h-12", md: "w-14 h-14 md:w-16 md:h-16", lg: "w-[4.5rem] h-[4.5rem] md:w-20 md:h-20" }[theme.categoryStyle.size] ?? "w-14 h-14 md:w-16 md:h-16";
  const catShapeCls = { rounded: "rounded-2xl", circle: "rounded-full", square: "rounded-none" }[theme.categoryStyle.shape] ?? "rounded-2xl";
  const catImgCls = theme.categoryStyle.shape === "circle" ? "w-full h-full object-cover rounded-full" : "w-8 h-8 object-contain";

  // ── Sections (order admin-controlled via Settings) ──
  const sections: Record<string, React.ReactNode> = {
    slider: homepage.slider.enabled ? (
      <HeroBanner
        slides={homepage.slider.slides}
        interval={homepage.slider.interval}
        motion={homepage.slider.motion}
        desktopHeight={homepage.slider.desktopHeight}
        mobileHeight={homepage.slider.mobileHeight}
      />
    ) : null,

    categories: (
      <div className="mt-5 px-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">Category Menu</h2>
          <Link href="/products" className="text-xs font-semibold flex items-center gap-0.5" style={{ color: brand }}>
            View All <span>›</span>
          </Link>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {categories.slice(0, 8).map((cat) => (
            <Link key={cat.id} href={`/category/${cat.slug}`} className="flex flex-col items-center gap-2 group">
              <div className={`${catSizeCls} ${catShapeCls} bg-white border border-orange-100 flex items-center justify-center shadow-sm group-hover:border-orange-400 group-hover:bg-orange-50 transition-all group-hover:scale-105 overflow-hidden`}>
                {cat.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cat.image} alt={cat.name} className={catImgCls} />
                ) : (
                  <span className="text-2xl">{cat.icon}</span>
                )}
              </div>
              <span className="text-[10px] text-center text-gray-600 leading-tight font-medium group-hover:text-orange-500 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    ),

    flashStory: <FlashDeal deal={homepage.flashDeal} story={homepage.story} />,

    featured: featuredProducts.length > 0 ? (
      <div className="mt-5 px-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">Featured Products</h2>
          <Link href="/products" className="text-xs font-semibold flex items-center gap-0.5" style={{ color: brand }}>
            View All <span>›</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {featuredProducts.map((product, idx) => {
            const rating = productRatings[idx % productRatings.length];
            const count = productReviews[idx % productReviews.length];
            const regular = Number(product.basePrice);
            const sale = product.salePrice ? Number(product.salePrice) : null;
            const onSale = sale !== null && sale > 0 && sale < regular;
            const price = onSale ? sale! : regular;
            const disc = onSale ? (product.discountPct ?? Math.round((1 - sale! / regular) * 100)) : null;
            return (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border border-gray-100"
              >
                <div className="relative h-44 bg-gray-50 overflow-hidden">
                  {product.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">{product.category.icon}</div>
                  )}
                  <div className="absolute top-2 right-2">
                    <LikeButton productId={product.id} />
                  </div>
                  {product.isFeatured && (
                    <span className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">⭐ Featured</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">{product.name}</p>
                  <StarRating rating={rating} count={count} />
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-900">₹{price.toLocaleString("en-IN")}</span>
                    {onSale && <span className="text-xs text-gray-400 line-through">₹{regular.toLocaleString("en-IN")}</span>}
                    {onSale && disc ? <span className="text-[10px] font-bold text-orange-500">{disc}% OFF</span> : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    ) : null,

    howItWorks: (
      <div className="mt-6 mx-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-900 mb-4 text-center">How It Works</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: "🎨", step: "01", title: "Choose & Customize" },
            { icon: "🛒", step: "02", title: "Place Order" },
            { icon: "🚚", step: "03", title: "Get Delivered" },
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl">{s.icon}</div>
              <p className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">Step {s.step}</p>
              <p className="text-xs font-semibold text-gray-700 leading-tight">{s.title}</p>
            </div>
          ))}
        </div>
      </div>
    ),

    testimonials: (
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
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: brand }}>{t.initial}</div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{t.name}</p>
                  <p className="text-[9px] text-gray-400">{t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),

    cta: (
      <div className="mt-4 mx-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-center">
        <p className="text-white font-bold text-base">Create Something Special</p>
        <p className="text-orange-100 text-xs mt-1 mb-4">Design your perfect personalized gift today</p>
        <Link href="/products" className="inline-block bg-white text-orange-500 font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-orange-50 transition-colors">
          Start Customizing →
        </Link>
      </div>
    ),
  };

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
                <img src={storeLogo} alt={storeName} style={{ height: theme.logoHeight }} className="w-auto object-contain" />
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
              <Search className="w-4 h-4" style={{ color: brand }} />
              <span className="text-sm text-gray-400 transition-colors">{theme.searchPlaceholder}</span>
            </Link>

            {/* Icons — admin toggles */}
            <div className="flex items-center gap-1">
              {theme.icons.wishlist && (
                <Link href="/login" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <Heart className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full text-white text-[8px] flex items-center justify-center font-bold" style={{ background: brand }}>2</span>
                </Link>
              )}
              {theme.icons.cart && (
                <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full text-white text-[8px] flex items-center justify-center font-bold" style={{ background: brand }}>5</span>
                </Link>
              )}
              {theme.icons.bell && (
                <Link href="/track" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full text-white text-[8px] flex items-center justify-center font-bold" style={{ background: brand }}>3</span>
                </Link>
              )}
            </div>
          </div>

          {/* Location bar */}
          <LocationBar />
        </div>
      </header>

      <div className="max-w-lg mx-auto md:max-w-7xl">
        {/* ── Sections in admin-set order ── */}
        {homepage.sectionOrder.map((key) => (
          <div key={key}>{sections[key] ?? null}</div>
        ))}

        {/* ── Footer ── */}
        <footer className="mt-6 bg-gray-900 text-gray-400 py-8 px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-white font-bold mb-2">{storeName}</p>
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
                <p>📞 {storePhone}</p>
                <p>✉️ {storeEmail}</p>
                <p>🚚 Pan India Delivery</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-4 text-center text-xs text-gray-600">
            © 2026 {storeName}. All rights reserved. | Made with ❤️ in India
          </div>
        </footer>
      </div>

      {/* ── Bottom Nav (mobile only) ── */}
      <BottomNav />
    </div>
  );
}
