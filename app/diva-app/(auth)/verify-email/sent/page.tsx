import Link from "next/link";
import { GlassCard } from "@/components/diva/ui/glass-card";

export const metadata = { title: "Check Your Email — DIVA Growth Capital" };

export default function DivaVerifyEmailSentPage() {
  return (
    <GlassCard className="p-8 text-center">
      <div className="text-4xl mb-4">✉️</div>
      <h2 className="text-white font-semibold text-xl mb-2">Check your inbox</h2>
      <p className="text-white/50 text-sm mb-6">
        We've sent a verification link to your email address. Click the link to activate your account.
      </p>
      <Link href="/diva-app/login" className="text-[#D4AF37] text-sm hover:underline">
        Back to sign in
      </Link>
    </GlassCard>
  );
}
