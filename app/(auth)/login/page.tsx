import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login — BMW Rental Admin",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            BMW Rental
          </h1>
          <p className="text-zinc-400 mt-2">Sign in to your account</p>
        </div>
        <LoginForm
          callbackUrl={params.callbackUrl}
          error={params.error}
        />
      </div>
    </div>
  );
}
