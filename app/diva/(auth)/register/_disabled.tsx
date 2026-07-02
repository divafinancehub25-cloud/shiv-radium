import type { Metadata } from "next";
import { RegisterForm } from "@/components/diva/auth/register-form";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <div className="w-full max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Create Your Account</h1>
        <p className="mt-2 text-sm text-zinc-500">Join the DIVA Growth Capital investment platform</p>
        <div className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
      </div>
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-8">
        <RegisterForm />
      </div>
    </div>
  );
}
