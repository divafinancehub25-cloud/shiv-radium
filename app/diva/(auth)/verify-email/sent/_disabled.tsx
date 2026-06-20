import { Mail } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailSentPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-10 text-center space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37]/20">
          <Mail className="h-8 w-8 text-[#D4AF37]" />
        </div>
        <h2 className="text-2xl font-bold text-white">Check your inbox</h2>
        <p className="text-sm text-zinc-400">
          We sent a verification link to your email. Click it to activate your account.
        </p>
        <Link href="/diva/login" className="inline-block text-sm text-[#D4AF37] hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
