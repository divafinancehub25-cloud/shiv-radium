"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (res.ok) {
      setStep("otp");
    } else {
      setError(data.error || "Failed to send OTP");
    }
    setLoading(false);
  }

  async function verifyOtp() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push("/");
    } else {
      setError(data.error || "Invalid OTP");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-orange-500">
            Shiv <span className="text-gray-900">Radium</span>
          </Link>
          <p className="text-gray-500 mt-2">Login to track your orders</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          {step === "phone" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <div className="flex gap-2">
                  <span className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-500 bg-gray-50">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="9876543210"
                    maxLength={10}
                  />
                </div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                onClick={sendOtp}
                disabled={loading || phone.length !== 10}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500">OTP sent to <strong>+91 {phone}</strong></p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-center tracking-widest text-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="------"
                  maxLength={6}
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                onClick={verifyOtp}
                disabled={loading || otp.length !== 6}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                className="w-full text-sm text-gray-500 hover:text-orange-500 transition-colors"
              >
                Change number
              </button>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          <Link href="/track" className="text-orange-500 hover:underline">Track order without login →</Link>
        </p>
      </div>
    </div>
  );
}
