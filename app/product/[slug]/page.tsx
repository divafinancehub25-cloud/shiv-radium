import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import CustomizerTool from "@/components/CustomizerTool";
import FrameCustomizer from "@/components/FrameCustomizer";

export const dynamic = "force-dynamic";

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
      frameTemplates: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!product) notFound();

  const frameTemplates = product.frameTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    elements: (t.elements as unknown as never[]) ?? [],
    bgImage: t.bgImage,
    options: (t.options as unknown as never) ?? null,
  }));

  const extras = {
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    discountPct: product.discountPct,
    manageStock: product.manageStock,
    stockQty: product.stockQty,
    stockStatus: product.stockStatus,
    soldIndividually: product.soldIndividually,
    shippingClass: product.shippingClass,
    shippingCost: product.shippingCost ? Number(product.shippingCost) : null,
    codAvailable: product.codAvailable,
    weightGrams: product.weightGrams,
    lengthIn: product.lengthIn,
    widthIn: product.widthIn,
    heightIn: product.heightIn,
    noReturnPolicy: product.noReturnPolicy,
    attributes: (product.attributes as { name: string; values: string[] }[] | null) ?? null,
  };

  const serializedProduct = {
    ...product,
    ...extras,
    basePrice: Number(product.basePrice),
    fields: product.fields.map((f) => ({
      ...f,
      options: f.options.map((o) => ({ ...o, price: o.price ? Number(o.price) : null })),
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-orange-500">
            Shiv <span className="text-gray-900">Radium</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href={`/category/${product.category.slug}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <Link href="/cart" className="border border-gray-200 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Cart
            </Link>
          </div>
        </div>
      </header>

      {frameTemplates.length > 0 ? (
        <div className="pt-6">
          <FrameCustomizer
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              basePrice: Number(product.basePrice),
              deliveryDays: product.deliveryDays,
              images: product.images,
              ...extras,
            }}
            templates={frameTemplates}
          />
        </div>
      ) : (
        <CustomizerTool product={serializedProduct} />
      )}
    </div>
  );
}
