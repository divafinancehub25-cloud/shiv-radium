"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Phone, User, Globe, Lock, Gift } from "lucide-react";
import { GoldInput } from "@/components/diva/ui/gold-input";
import { GoldButton } from "@/components/diva/ui/gold-button";
import { registerUser } from "@/actions/diva/auth";
import { registerSchema } from "@/lib/diva/validators/auth";
import type { z } from "zod";

type FormErrors = Partial<Record<string, string>>;

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
    { label: "Special char", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500"];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : "bg-white/10"}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map((c) => (
          <span key={c.label} className={`text-xs ${c.ok ? "text-emerald-400" : "text-zinc-600"}`}>
            {c.ok ? "✓" : "○"} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phone: "", country: "",
    password: "", confirmPassword: "", referralCode: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setServerError("");

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const errs: FormErrors = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsed.error.issues.forEach((e: any) => { if (e.path[0] != null) errs[String(e.path[0])] = e.message; });
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser(parsed.data);
      setLoading(false);
      if (result.error) { setServerError(result.error); return; }
      router.push(`/diva-app/verify-email/sent?email=${encodeURIComponent(form.email)}`);
    } catch (err: any) {
      setLoading(false);
      setServerError(err?.message ? `Error: ${err.message}` : "Kuch galat hua. Thodi der baad try karein.");
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <GoldInput label="Full Name" placeholder="John Smith" icon={<User size={16} />}
          value={form.name} onChange={set("name")} error={errors.name} />
        <GoldInput label="Email Address" type="email" placeholder="you@example.com" icon={<Mail size={16} />}
          value={form.email} onChange={set("email")} error={errors.email} />
        <GoldInput label="Phone Number" placeholder="+1 234 567 8900" icon={<Phone size={16} />}
          value={form.phone} onChange={set("phone")} error={errors.phone} />
        <GoldInput label="Country" placeholder="United States" icon={<Globe size={16} />}
          value={form.country} onChange={set("country")} error={errors.country} />
      </div>

      <div className="relative">
        <GoldInput label="Password" type={showPw ? "text" : "password"} placeholder="Create a strong password"
          icon={<Lock size={16} />} value={form.password} onChange={set("password")} error={errors.password} />
        <button type="button" onClick={() => setShowPw(!showPw)}
          className="absolute right-3 top-9 text-zinc-500 hover:text-zinc-300">
          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {form.password && <PasswordStrength password={form.password} />}

      <div className="relative">
        <GoldInput label="Confirm Password" type={showConfirm ? "text" : "password"} placeholder="Repeat your password"
          icon={<Lock size={16} />} value={form.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} />
        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
          className="absolute right-3 top-9 text-zinc-500 hover:text-zinc-300">
          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <GoldInput label="Referral Code (optional)" placeholder="DIVA0000" icon={<Gift size={16} />}
        value={form.referralCode} onChange={set("referralCode")} />

      {serverError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {serverError}
        </div>
      )}

      <GoldButton type="submit" loading={loading} className="w-full py-3.5 text-base">
        Create Account
      </GoldButton>

      <p className="text-center text-xs text-zinc-600">
        By registering, you agree to our{" "}
        <a href="#" className="text-[#D4AF37] hover:underline">Terms of Service</a> and{" "}
        <a href="#" className="text-[#D4AF37] hover:underline">Privacy Policy</a>
      </p>
    </motion.form>
  );
}
