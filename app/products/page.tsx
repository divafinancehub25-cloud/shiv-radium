import Link from "next/link";
import { db } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import ProductsClient from "./ProductsClient";
import LogoMark from "@/components/LogoMark";
import { getStorefrontConfig } from "@/lib/storefront";

export const dynamic = "force-dynamic";
export const metadata = { title: "All Products — Shiv Radium" };

export default async function ProductsPage() {
  const [rawProducts, categories, config] = await Promise.all([
    db.product.findMany({
      where: { isActive: true },
      include: { category: { select: { name: true, slug: true, icon: true } } },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
    }),
    db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    getStorefrontConfig(),
  ]);

  // Serialize Decimals for the client component
  const products = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    basePrice: Number(p.basePrice),
    salePrice: p.salePrice ? Number(p.salePrice) : null,
    discountPct: p.discountPct,
    deliveryDays: p.deliveryDays,
    images: p.images,
    category: p.category,
  }));

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <LogoMark logo={config.storeLogo} name={config.storeName} height={config.theme.logoHeight} />
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
        <ProductsClient products={products} categories={categories} />
      </div>
    </div>
  );
}
