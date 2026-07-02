"use client";

import { useState } from "react";
import { adminSendTestEmail } from "@/actions/diva/email";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

export function TestEmailBtn() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Enter an email address");
    setLoading(true);
    const res = await adminSendTestEmail(email);
    if (res.success) toast.success(`Test email sent to ${email}!`);
    else toast.error(res.error ?? "Failed to send");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSend} className="flex gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="recipient@example.com"
        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50 transition-colors placeholder:text-white/20"
      />
      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {loading ? "Sending..." : "Send Test"}
      </button>
    </form>
  );
}
