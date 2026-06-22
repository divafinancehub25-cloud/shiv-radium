export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ProductForm from "../ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
  const product = await db.product.findUnique({
    where: { id },
    include: { fields: { orderBy: { sortOrder: "asc" }, include: { options: { orderBy: { sortOrder: "asc" } } } } },
  });
  if (!product) notFound();

  const serialized = {
    ...product,
    basePrice: Number(product.basePrice),
    fields: product.fields.map((f: typeof product.fields[0]) => ({
      ...f,
      options: f.options.map((o: typeof f.options[0]) => ({ ...o, price: o.price ? Number(o.price) : null })),
    })),
  };

  return <ProductForm categories={categories} product={serialized} />;
}
