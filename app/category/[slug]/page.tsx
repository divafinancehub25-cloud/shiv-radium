import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import LogoMark from "@/components/LogoMark";
import { getStorefrontConfig } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await db.category.findUnique({ where: { slug } });
  if (!category) return {};
  return { title: category.name };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const category = await db.category.findUnique({
    where: { slug, isActive: true },
    include: {
      products: {
        where: { isActive: true },
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
      },
    },
  });

  if (!category) notFound();

  const config = await getStorefrontConfig();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <LogoMark logo={config.storeLogo} name={config.storeName} />
          <Link href="/cart" className="border border-gray-200 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Cart
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>

        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            {category.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={category.image} alt={category.name} className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <span className="text-4xl">{category.icon}</span>
            )}
            <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
          </div>
          {category.description && (
            <p className="text-gray-500 mt-1">{category.description}</p>
          )}
          <p className="text-sm text-orange-500 font-medium mt-2">{category.products.length} products</p>
        </div>

        {/* Products Grid */}
        {category.products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🔨</p>
            <p className="font-medium">Products coming soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {category.products.map((product) => (
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
                    <span className="text-5xl">{category.icon}</span>
                  )}
                </div>
                <div className="p-4">
                  {product.isFeatured && (
                    <span className="inline-block text-xs bg-orange-100 text-orange-600 font-medium px-2 py-0.5 rounded-full mb-2">
                      Featured
                    </span>
                  )}
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2 group-hover:text-orange-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    {product.salePrice && Number(product.salePrice) < Number(product.basePrice) ? (
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-gray-900">₹{Number(product.salePrice)}</span>
                        <span className="text-xs text-gray-400 line-through">₹{Number(product.basePrice)}</span>
                        <span className="text-[10px] font-bold text-green-600">
                          {product.discountPct ?? Math.round((1 - Number(product.salePrice) / Number(product.basePrice)) * 100)}% OFF
                        </span>
                      </span>
                    ) : (
                      <span className="font-bold text-gray-900">₹{Number(product.basePrice)}</span>
                    )}
                    <span className="text-xs text-gray-400">{product.deliveryDays}d delivery</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
