import Link from "next/link";
import { db } from "@/lib/db";
import { ShoppingBag, Star, Truck, Shield, Gift, Phone, Mail, Instagram, Facebook } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featuredProducts] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: { category: { select: { name: true, slug: true, icon: true } } },
      orderBy: { sortOrder: "asc" },
      take: 8,
    }),
  ]);

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-orange-500 text-white text-xs py-2 text-center font-medium">
        🎁 Free Delivery on orders above ₹999 &nbsp;|&nbsp; 🌟 4.9★ Rated &nbsp;|&nbsp; 📞 Call: +91 98765 43210
      </div>

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
            <Link href="/track" className="hidden md:block text-sm text-gray-600 hover:text-orange-500 transition-colors font-medium">
              Track Order
            </Link>
            <Link href="/login" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-orange-50 via-amber-50 to-white overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-64 h-64 bg-orange-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
              🎨 Live Customization
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-5 leading-tight">
              Gifts That Speak<br />
              <span className="text-orange-500">From The Heart</span>
            </h1>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed">
              Photo frames, mugs, name boards, trophies & more — customized with love. Design online, delivered to your door.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-xl shadow-orange-200 text-base">
                🛍️ Shop Now
              </Link>
              <Link href="/track" className="border-2 border-gray-200 text-gray-700 hover:border-orange-400 hover:text-orange-500 font-semibold px-8 py-4 rounded-xl transition-colors text-base">
                📦 Track Order
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-8 text-sm text-gray-500">
              <div className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-orange-500" /> Pan India</div>
              <div className="flex items-center gap-1.5"><Star className="w-4 h-4 text-orange-500" /> 4.9★ (2000+ Reviews)</div>
              <div className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-orange-500" /> 100% Safe</div>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center">
            <div className="relative">
              <div className="w-80 h-80 bg-gradient-to-br from-orange-400 to-amber-400 rounded-3xl rotate-6 opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center text-9xl">🎁</div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl px-4 py-2 text-sm font-bold text-gray-900">
                ✨ Live Preview
              </div>
              <div className="absolute -bottom-4 -left-4 bg-orange-500 text-white rounded-2xl shadow-xl px-4 py-2 text-sm font-bold">
                🚚 Fast Delivery
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-gray-50 border-y border-gray-100 py-5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            {[
              { icon: "🚚", title: "Pan India Delivery", sub: "2–7 working days" },
              { icon: "🎨", title: "Live Customization", sub: "Design before you buy" },
              { icon: "⭐", title: "4.9★ Rating", sub: "2000+ happy customers" },
              { icon: "🔒", title: "100% Secure", sub: "Safe payments" },
            ].map((b) => (
              <div key={b.title} className="flex flex-col items-center gap-1 py-2">
                <span className="text-2xl">{b.icon}</span>
                <p className="font-semibold text-gray-800 text-xs">{b.title}</p>
                <p className="text-gray-400 text-xs">{b.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-14 max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Shop by Category</h2>
            <p className="text-gray-500 mt-2">Find the perfect personalized gift</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/category/${cat.slug}`}
                className="group flex flex-col items-center gap-3 p-5 border-2 border-gray-100 rounded-2xl hover:border-orange-400 hover:bg-orange-50 transition-all hover:shadow-lg hover:-translate-y-1">
                <span className="text-4xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600 text-center leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-8 pb-16 max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-gray-500 mt-1">Our bestsellers, loved by thousands</p>
            </div>
            <Link href="/products" className="text-orange-500 hover:text-orange-600 text-sm font-semibold border border-orange-200 hover:bg-orange-50 px-4 py-2 rounded-xl transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <Link key={product.id} href={`/product/${product.slug}`}
                className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all hover:-translate-y-1">
                <div className="bg-gray-50 h-48 flex items-center justify-center overflow-hidden group-hover:bg-orange-50 transition-colors relative">
                  {product.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-5xl">{product.category.icon}</span>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">⭐ Featured</span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-orange-500 font-medium mb-1">{product.category.icon} {product.category.name}</p>
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2 group-hover:text-orange-600 transition-colors">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-base">₹{Number(product.basePrice)}</span>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{product.deliveryDays}d delivery</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="bg-orange-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="text-gray-500 mt-2">3 simple steps to your perfect gift</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: "🎨", title: "Choose & Customize", desc: "Pick a product, add your text, photo or design using our live preview tool." },
              { step: "02", icon: "🛒", title: "Place Your Order", desc: "Add to cart, enter delivery address, and pay securely via Razorpay." },
              { step: "03", icon: "🚚", title: "Delivered to You", desc: "We craft your gift with care and deliver it pan India in 2-7 days." },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-lg transition-shadow">
                <div className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">Step {s.step}</div>
                <div className="text-5xl mb-4">{s.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">What Our Customers Say</h2>
          <p className="text-gray-500 mt-2">Real reviews from happy customers</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Priya Sharma", city: "Delhi", rating: 5, text: "Ordered a custom name plate for my sister's birthday. The quality was amazing and delivery was super fast! Will definitely order again.", initial: "P" },
            { name: "Rahul Verma", city: "Mumbai", rating: 5, text: "The live customizer is so cool! I could see exactly how the mug would look before ordering. My parents loved the gift!", initial: "R" },
            { name: "Anita Singh", city: "Bangalore", rating: 5, text: "Superb quality and packaging. Got a personalized photo frame for our anniversary. Looked exactly like the preview. Highly recommended!", initial: "A" },
          ].map((t) => (
            <div key={t.name} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {t.initial}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-orange-500 to-amber-500 py-14">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Create Something Special?</h2>
          <p className="text-orange-100 mb-8 text-lg">Browse our collection and design your perfect personalized gift today.</p>
          <Link href="/products" className="inline-block bg-white text-orange-500 font-bold px-10 py-4 rounded-xl hover:bg-orange-50 transition-colors shadow-xl text-base">
            Start Customizing →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div>
            <p className="text-white font-bold text-xl mb-2">Shiv Radium</p>
            <p className="text-sm leading-relaxed">Personalized gifts crafted with love for every occasion.</p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-orange-500 transition-colors"><Instagram className="w-4 h-4" /></a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-orange-500 transition-colors"><Facebook className="w-4 h-4" /></a>
            </div>
          </div>
          <div>
            <p className="text-white font-semibold mb-3">Quick Links</p>
            <div className="space-y-2 text-sm">
              <Link href="/products" className="block hover:text-orange-400 transition-colors">All Products</Link>
              <Link href="/track" className="block hover:text-orange-400 transition-colors">Track Order</Link>
              <Link href="/login" className="block hover:text-orange-400 transition-colors">Login</Link>
              <Link href="/cart" className="block hover:text-orange-400 transition-colors">Cart</Link>
            </div>
          </div>
          <div>
            <p className="text-white font-semibold mb-3">Categories</p>
            <div className="space-y-2 text-sm">
              {categories.slice(0, 5).map((c) => (
                <Link key={c.id} href={`/category/${c.slug}`} className="block hover:text-orange-400 transition-colors">{c.name}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-white font-semibold mb-3">Contact Us</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-orange-500" /> +91 98765 43210</div>
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-orange-500" /> orders@shivradium.com</div>
              <div className="flex items-center gap-2"><Gift className="w-4 h-4 text-orange-500" /> Pan India Delivery</div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 border-t border-gray-800 mt-8 pt-6 text-center text-xs text-gray-600">
          © 2025 Shiv Radium. All rights reserved. | Made with ❤️ in India
        </div>
      </footer>
    </div>
  );
}
