"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";

type Category = { id: string; name: string; slug: string; icon: string | null };

// Three-dot Category menu — sits left of the logo on the All Products page
export default function CategoryMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Esc
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Categories menu"
        className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
          open ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <MoreVertical className="w-4 h-4" />
        <span className="hidden sm:inline">Category</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-60 max-h-[70vh] overflow-y-auto bg-white rounded-2xl shadow-2xl z-50 py-2">
          <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Categories</p>
          <Link
            href="/products"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-orange-50 transition-colors"
          >
            🛍️ All Products
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
            >
              <span className="text-base">{c.icon}</span> {c.name}
            </Link>
          ))}
          {categories.length === 0 && (
            <p className="px-4 py-3 text-xs text-gray-400">Koi category nahi hai</p>
          )}
        </div>
      )}
    </div>
  );
}
