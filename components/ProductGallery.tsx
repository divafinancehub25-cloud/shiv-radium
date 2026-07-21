"use client";

import { useState } from "react";
import LikeButton from "@/components/LikeButton";

// Flipkart/Amazon-style gallery: big main image + clickable thumbnails
export default function ProductGallery({
  images,
  name,
  productId,
  fallback = "🎁",
}: {
  images: string[];
  name: string;
  productId?: string;
  fallback?: string;
}) {
  const [active, setActive] = useState(0);
  const list = images?.filter(Boolean) ?? [];

  return (
    <div className="space-y-3">
      <div className="relative w-full aspect-square bg-white rounded-2xl shadow-sm overflow-hidden flex items-center justify-center">
        {list[active] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={list[active]} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-8xl">{fallback}</span>
        )}
        {productId && (
          <div className="absolute top-3 right-3">
            <LikeButton productId={productId} size="lg" />
          </div>
        )}
      </div>

      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {list.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden transition-all ${
                i === active ? "ring-2 ring-gray-900 scale-105" : "opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
