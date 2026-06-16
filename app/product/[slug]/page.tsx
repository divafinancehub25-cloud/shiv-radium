import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ArrowLeft, Truck, Shield, Clock } from "lucide-react";
import CustomizationForm from "./CustomizationForm";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await db.product.findUnique({ where: { slug }, select: { name: true, description: true } });
  if (!product) return {};
  return { title: product.name, description: product.description ?? undefined };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await db.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: { select: { name: true, slug: true, icon: true } },
      fields: {
        orderBy: { sortOrder: "asc" },
        include: { options: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!product) notFound();

  // Serialize Decimal fields before passing to Client Components
  const serializedProduct = {
    ...product,
    basePrice: Number(product.basePrice),
    fields: product.fields.map((f) => ({
      ...f,
      options: f.options.map((o) => ({ ...o, price: o.price ? Number(o.price) : null })),
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
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
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-orange-500 transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/category/${product.category.slug}`} className="hover:text-orange-500 transition-colors">
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-gray-700">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* Left — Product image & info */}
          <div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl h-72 md:h-96 flex items-center justify-center text-8xl mb-6">
              {product.category.icon}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-gray-500 mb-4 leading-relaxed">{product.description}</p>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-gray-900">₹{serializedProduct.basePrice}</span>
              <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium">In Stock</span>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-5">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Truck className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Delivery in <strong className="text-gray-700">{product.deliveryDays} working days</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Shield className="w-4 h-4 text-orange-500 shrink-0" />
                <span>100% quality guarantee</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Order before 2 PM for same-day processing</span>
              </div>
            </div>
          </div>

          {/* Right — Customization form */}
          <div>
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-1 mb-6">
              <p className="text-center text-sm text-orange-700 font-medium py-2">
                ✏️ Customize your product below
              </p>
            </div>
            <CustomizationForm product={serializedProduct} />
          </div>
        </div>
      </div>
    </div>
  );
}
