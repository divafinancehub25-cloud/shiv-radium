"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";
import { GoldInput } from "@/components/diva/ui/gold-input";
import { GoldButton } from "@/components/diva/ui/gold-button";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { resetPassword } from "@/actions/diva/auth";

export function DivaResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const result = await resetPassword({ token, password, confirmPassword: confirm });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/diva-app/login"), 2500);
  }

  if (success) {
    return (
      <GlassCard className="p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <p className="text-white font-semibold">Password updated!</p>
        <p className="text-white/40 text-sm mt-2">Redirecting to sign in…</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-8">
      <h2 className="text-white font-semibold text-xl mb-1">Set new password</h2>
      <p className="text-white/40 text-sm mb-6">Choose a strong password for your account.</p>

      <motion.form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <GoldInput
            label="New Password"
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            icon={<Lock size={16} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-9 text-zinc-500 hover:text-zinc-300"
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <GoldInput
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          icon={<Lock size={16} />}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <GoldButton type="submit" loading={loading} className="w-full py-3.5">
          Update Password
        </GoldButton>
      </motion.form>
    </GlassCard>
  );
}
