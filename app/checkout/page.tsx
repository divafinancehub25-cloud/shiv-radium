"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, Truck, Lock } from "lucide-react";

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

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    giftWrapping: false,
    giftMessage: "",
    deliveryDate: "",
  });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("cart") ?? "[]");
    if (stored.length === 0) router.push("/cart");
    setCart(stored);
    setMounted(true);
  }, [router]);

  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const shipping = subtotal >= 999 ? 0 : 99;
  const giftWrapCharge = form.giftWrapping ? 49 : 0;
  const total = subtotal + shipping + giftWrapCharge;

  function set(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = "Name is required";
    if (!form.customerPhone.trim() || !/^[6-9]\d{9}$/.test(form.customerPhone)) e.customerPhone = "Valid 10-digit mobile number required";
    if (form.customerEmail && !/\S+@\S+\.\S+/.test(form.customerEmail)) e.customerEmail = "Invalid email";
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.state.trim()) e.state = "State is required";
    if (!form.pinCode.trim() || !/^\d{6}$/.test(form.pinCode)) e.pinCode = "Valid 6-digit PIN code required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function placeOrder() {
    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: cart,
          subtotal,
          shippingCharge: shipping,
          giftWrapCharge,
          totalAmount: total,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      // Razorpay payment
      if (data.razorpayOrderId) {
        await openRazorpay(data.razorpayOrderId, data.orderId, data.orderNumber);
      } else {
        // COD or free order
        localStorage.removeItem("cart");
        router.push(`/order-success?id=${data.orderId}&number=${data.orderNumber}`);
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function openRazorpay(razorpayOrderId: string, orderId: string, orderNumber: string) {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(script);

    await new Promise((resolve) => { script.onload = resolve; });

    const rzp = new (window as unknown as { Razorpay: new (opts: unknown) => { open(): void } }).Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: total * 100,
      currency: "INR",
      name: "Shiv Radium",
      description: `Order ${orderNumber}`,
      order_id: razorpayOrderId,
      prefill: {
        name: form.customerName,
        email: form.customerEmail,
        contact: form.customerPhone,
      },
      theme: { color: "#f97316" },
      handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        await fetch("/api/orders/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, ...response }),
        });
        localStorage.removeItem("cart");
        router.push(`/order-success?id=${orderId}&number=${orderNumber}`);
      },
    });
    rzp.open();
  }

  if (!mounted) return null;

  const inputClass = (key: string) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent ${
      errors[key] ? "border-red-400 bg-red-50" : "border-gray-200"
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-orange-500">
            Shiv <span className="text-gray-900">Radium</span>
          </Link>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Lock className="w-4 h-4 text-green-500" /> Secure Checkout
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/cart" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left — Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Delivery Details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <Truck className="w-5 h-5 text-orange-500" />
                <h2 className="font-bold text-gray-900">Delivery Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input className={inputClass("customerName")} placeholder="Your full name" value={form.customerName} onChange={(e) => set("customerName", e.target.value)} />
                  {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input className={inputClass("customerPhone")} placeholder="10-digit mobile number" maxLength={10} value={form.customerPhone} onChange={(e) => set("customerPhone", e.target.value.replace(/\D/g, ""))} />
                  {errors.customerPhone && <p className="text-red-500 text-xs mt-1">{errors.customerPhone}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email (for order updates)</label>
                  <input className={inputClass("customerEmail")} placeholder="email@example.com" type="email" value={form.customerEmail} onChange={(e) => set("customerEmail", e.target.value)} />
                  {errors.customerEmail && <p className="text-red-500 text-xs mt-1">{errors.customerEmail}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Address <span className="text-red-500">*</span>
                  </label>
                  <textarea className={inputClass("address") + " resize-none"} rows={2} placeholder="House no, Street, Locality..." value={form.address} onChange={(e) => set("address", e.target.value)} />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City <span className="text-red-500">*</span></label>
                  <input className={inputClass("city")} placeholder="City" value={form.city} onChange={(e) => set("city", e.target.value)} />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">State <span className="text-red-500">*</span></label>
                  <select className={inputClass("state") + " bg-white"} value={form.state} onChange={(e) => set("state", e.target.value)}>
                    <option value="">Select State</option>
                    {["Andhra Pradesh","Assam","Bihar","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">PIN Code <span className="text-red-500">*</span></label>
                  <input className={inputClass("pinCode")} placeholder="6-digit PIN code" maxLength={6} value={form.pinCode} onChange={(e) => set("pinCode", e.target.value.replace(/\D/g, ""))} />
                  {errors.pinCode && <p className="text-red-500 text-xs mt-1">{errors.pinCode}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Delivery Date</label>
                  <input type="date" className={inputClass("deliveryDate")} min={new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0]} value={form.deliveryDate} onChange={(e) => set("deliveryDate", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Gift Options */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4">🎁 Gift Options</h2>
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={form.giftWrapping}
                  onChange={(e) => set("giftWrapping", e.target.checked)}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-sm text-gray-700">Add gift wrapping <span className="text-orange-500 font-medium">(+₹49)</span></span>
              </label>
              {form.giftWrapping && (
                <textarea
                  rows={2}
                  placeholder="Gift message to include in the package..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  value={form.giftMessage}
                  onChange={(e) => set("giftMessage", e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Right — Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-24">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange-500" /> Order Summary
              </h2>

              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-gray-800 truncate">{item.productName}</p>
                      <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-gray-900 whitespace-nowrap">₹{item.totalPrice}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span><span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                </div>
                {giftWrapCharge > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Gift Wrapping</span><span>₹{giftWrapCharge}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                  <span>Total</span><span>₹{total}</span>
                </div>
              </div>

              <button
                onClick={placeOrder}
                disabled={loading}
                className="mt-5 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    Placing Order...
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Pay ₹{total}
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                🔒 Secured by Razorpay · 100% safe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
