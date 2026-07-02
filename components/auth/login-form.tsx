"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";

export function LoginForm({
  callbackUrl,
  error: initialError,
}: {
  callbackUrl?: string;
  error?: string;
}) {
  const [state, formAction, pending] = useActionState(loginAction, null);

  const errorMsg =
    state?.error ||
    (initialError === "CredentialsSignin" ? "Invalid email or password" : initialError ?? "");

  return (
    <form action={formAction} className="bg-[#1A1A1A] border border-zinc-800 rounded-2xl p-8 space-y-5">
      {/* Pass callbackUrl through hidden input so the action can read it */}
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/admin/dashboard"} />

      {errorMsg && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg">
          {errorMsg}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#1C69D4] focus:border-transparent"
          placeholder="admin@bmwrental.in"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Password
        </label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#1C69D4] focus:border-transparent"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-[#1C69D4] hover:bg-[#1557b8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
      >
        {pending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
