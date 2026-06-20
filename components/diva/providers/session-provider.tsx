"use client";
import { SessionProvider } from "next-auth/react";

export function DivaSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
