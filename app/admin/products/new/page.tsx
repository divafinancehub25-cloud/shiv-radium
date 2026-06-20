import { db } from "@/lib/db";
import ProductForm from "../ProductForm";

export default async function NewProductPage() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
  return <ProductForm categories={categories} />;
}
