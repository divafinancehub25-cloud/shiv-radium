"use client";
import { useParams } from "next/navigation";
import { DivaResetPasswordForm } from "@/components/diva/auth/reset-password-form";

export default function DivaResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  return <DivaResetPasswordForm token={token} />;
}
