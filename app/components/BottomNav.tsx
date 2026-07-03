"use client";
import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, ShoppingCart, MoreHorizontal, User, X, Package, Home as HomeIcon, LogIn, Phone } from "lucide-react";

export default function BottomNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  const itemClass = "flex flex-col items-center gap-0.5 text-gray-500 hover:text-orange-500 transition-colors";

  return (
    <>
      {/* Menu sheet */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 md:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="bg-white w-full rounded-t-3xl p-5 pb-24 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Menu</h3>
              <button onClick={() => setMenuOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/products", icon: <LayoutGrid className="w-5 h-5" />, label: "All Products" },
                { href: "/track", icon: <Package className="w-5 h-5" />, label: "Track Order" },
                { href: "/cart", icon: <ShoppingCart className="w-5 h-5" />, label: "Cart" },
                { href: "/login", icon: <LogIn className="w-5 h-5" />, label: "Login / Account" },
                { href: "/", icon: <HomeIcon className="w-5 h-5" />, label: "Home" },
                { href: "tel:+919876543210", icon: <Phone className="w-5 h-5" />, label: "Call Us" },
              ].map((m) => (
                <Link
                  key={m.label}
                  href={m.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 bg-gray-50 hover:bg-orange-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
                >
                  <span className="text-orange-500">{m.icon}</span> {m.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg md:hidden z-50">
        <div className="flex items-center justify-around py-2">
          <Link href="/products" className={itemClass}>
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[9px] font-medium">Categories</span>
          </Link>
          <Link href="/cart" className={itemClass}>
            <ShoppingCart className="w-5 h-5" />
            <span className="text-[9px] font-medium">Cart</span>
          </Link>
          <Link href="/" className="flex flex-col items-center gap-0.5 -mt-4">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-200">
              <HomeIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-[9px] font-medium text-orange-500 mt-0.5">Home</span>
          </Link>
          <button onClick={() => setMenuOpen(true)} className={itemClass}>
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[9px] font-medium">Menu</span>
          </button>
          <Link href="/login" className={itemClass}>
            <User className="w-5 h-5" />
            <span className="text-[9px] font-medium">Account</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
