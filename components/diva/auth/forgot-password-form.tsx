"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { GoldInput } from "@/components/diva/ui/gold-input";
import { GoldButton } from "@/components/diva/ui/gold-button";
import { forgotPassword } from "@/actions/diva/auth";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await forgotPassword({ email });
    setLoading(false);
    if (result.error) { setError(String(result.error)); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37]/20">
          <Mail className="h-8 w-8 text-[#D4AF37]" />
        </div>
        <h3 className="text-lg font-semibold text-white">Check your email</h3>
        <p className="text-sm text-zinc-400">
          If an account exists for <span className="text-[#D4AF37]">{email}</span>, we&apos;ve sent a reset link.
        </p>
        <Link href="/diva-app/login" className="inline-block text-sm text-[#D4AF37] hover:underline">
          Back to sign in
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit} className="space-y-5"
    >
      <GoldInput
        label="Email Address" type="email" placeholder="you@example.com"
        icon={<Mail size={16} />} value={email} onChange={(e) => setEmail(e.target.value)} required
      />
      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      <GoldButton type="submit" loading={loading} className="w-full py-3.5 text-base">
        Send Reset Link
      </GoldButton>
      <p className="text-center text-sm text-zinc-500">
        Remember it?{" "}
        <Link href="/diva-app/login" className="text-[#D4AF37] hover:underline">Back to sign in</Link>
      </p>
    </motion.form>
  );
}
