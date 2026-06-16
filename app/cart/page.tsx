"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, ArrowLeft, ShoppingBag } from "lucide-react";

type CartItem = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizationData: Record<string, string>;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("cart") ?? "[]"));
    setMounted(true);
  }, []);

  function removeItem(id: string) {
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  }

  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-orange-500">
            Shiv <span className="text-gray-900">Radium</span>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/products" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>

        {cart.length === 0 ? (
          <div className="text-center py-24">
            <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium mb-6">Your cart is empty</p>
            <Link href="/products" className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Link href={`/product/${item.productSlug}`} className="font-semibold text-gray-900 hover:text-orange-500 transition-colors">
                        {item.productName}
                      </Link>
                      <p className="text-sm text-gray-400 mt-0.5">Qty: {item.quantity}</p>

                      {/* Customization summary */}
                      <div className="mt-2 space-y-0.5">
                        {Object.entries(item.customizationData)
                          .filter(([, v]) => v && !v.startsWith("blob:"))
                          .map(([k, v]) => (
                            <p key={k} className="text-xs text-gray-400">
                              <span className="capitalize">{k.replace(/_/g, " ")}</span>: {v}
                            </p>
                          ))}
                        {Object.values(item.customizationData).some((v) => v?.startsWith("blob:")) && (
                          <p className="text-xs text-green-600">📷 Photo uploaded</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{item.totalPrice}</p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="mt-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-24">
                <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                      {shipping === 0 ? "FREE" : `₹${shipping}`}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-orange-500">Add ₹{999 - subtotal} more for free shipping</p>
                  )}
                  <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-base">
                    <span>Total</span>
                    <span>₹{total}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="mt-5 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-orange-100"
                >
                  Proceed to Checkout →
                </Link>

                <p className="text-xs text-gray-400 text-center mt-3">
                  Secure checkout · 100% safe
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
