import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/diva/auth/forgot-password-form";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Reset Password</h1>
        <p className="mt-2 text-sm text-zinc-500">We&apos;ll send a reset link to your email</p>
        <div className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
      </div>
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-8">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
