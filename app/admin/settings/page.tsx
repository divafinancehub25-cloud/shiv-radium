export const dynamic = "force-dynamic";

import LogoUpload from "./LogoUpload";

export default function AdminSettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="space-y-6 max-w-2xl">
        {/* Logo */}
        <LogoUpload />

        {/* Store Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Store Info</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Name</label>
              <input defaultValue="Shiv Radium" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Phone</label>
              <input placeholder="+91 XXXXX XXXXX" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Email</label>
              <input placeholder="orders@shivradium.com" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Payment — Razorpay</h2>
          <p className="text-xs text-gray-400 mb-4">Keys Vercel environment variables mein set karo</p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">RAZORPAY_KEY_ID</span>
              <span className="font-mono text-gray-400 text-xs">{process.env.RAZORPAY_KEY_ID ? "✓ Set" : "Not set"}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">RAZORPAY_KEY_SECRET</span>
              <span className="font-mono text-gray-400 text-xs">{process.env.RAZORPAY_KEY_SECRET ? "✓ Set" : "Not set"}</span>
            </div>
          </div>
        </div>

        {/* Shipping */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Shipping</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between"><span>Free shipping above</span><span className="font-semibold text-gray-900">₹999</span></div>
            <div className="flex justify-between"><span>Standard shipping charge</span><span className="font-semibold text-gray-900">₹99</span></div>
            <div className="flex justify-between"><span>Gift wrapping charge</span><span className="font-semibold text-gray-900">₹49</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
