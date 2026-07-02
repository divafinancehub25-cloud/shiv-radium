import { Suspense } from "react";
import { DivaLoginForm } from "@/components/diva/auth/login-form";

export const metadata = { title: "Sign In — DIVA Growth Capital" };

export default function DivaLoginPage() {
  return (
    <Suspense fallback={<div className="h-40 rounded-2xl bg-white/[0.03] animate-pulse" />}>
      <DivaLoginForm />
    </Suspense>
  );
}
