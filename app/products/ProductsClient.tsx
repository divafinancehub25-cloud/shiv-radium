"use client";

import { useState } from "react";
import Link from "next/link";
import SearchBar from "./SearchBar";
import LikeButton from "@/components/LikeButton";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  salePrice?: number | null;
  discountPct?: number | null;
  deliveryDays: number;
  images: string[];
  category: { name: string; slug: string; icon: string | null };
};

type Category = { id: string; name: string; slug: string; icon: string | null };

export default function ProductsClient({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("");

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCat || p.category.slug === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <>
      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <SearchBar onSearch={setSearch} />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCat("")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!selectedCat ? "bg-orange-500 text-white" : "border border-gray-200 text-gray-600 hover:border-orange-400"}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(selectedCat === c.slug ? "" : c.slug)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedCat === c.slug ? "bg-orange-500 text-white" : "border border-gray-200 text-gray-600 hover:border-orange-400"}`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {search && (
        <p className="text-sm text-gray-500 mb-4">{filtered.length} results for &ldquo;{search}&rdquo;</p>
      )}

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="font-medium">No products found</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all hover:-translate-y-1"
            >
              <div className="relative bg-gray-50 h-48 flex items-center justify-center overflow-hidden group-hover:bg-orange-50 transition-colors">
                {product.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <span className="text-5xl">{product.category.icon}</span>
                )}
                <div className="absolute top-2 right-2">
                  <LikeButton productId={product.id} />
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-orange-500 font-medium mb-1">{product.category.icon} {product.category.name}</p>
                <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2 group-hover:text-orange-600 transition-colors">{product.name}</h3>
                <p className="text-xs text-gray-400 line-clamp-2 mb-3">{product.description}</p>
                <div className="flex items-center justify-between">
                  {product.salePrice && product.salePrice < product.basePrice ? (
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-gray-900">₹{product.salePrice}</span>
                      <span className="text-xs text-gray-400 line-through">₹{product.basePrice}</span>
                      <span className="text-[10px] font-bold text-green-600">
                        {product.discountPct ?? Math.round((1 - product.salePrice / product.basePrice) * 100)}% OFF
                      </span>
                    </span>
                  ) : (
                    <span className="font-bold text-gray-900">₹{product.basePrice}</span>
                  )}
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{product.deliveryDays}d delivery</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
