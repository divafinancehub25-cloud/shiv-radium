"use client";

import { signOut } from "next-auth/react";
import { Role } from "@prisma/client";

type Props = {
  user: { name: string; email: string; role: Role };
};

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  DRIVER: "Driver",
  CUSTOMER: "Customer",
};

export function AdminHeader({ user }: Props) {
  return (
    <header className="h-16 bg-[#111111] border-b border-zinc-800 flex items-center justify-between px-6 shrink-0">
      <div />

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-zinc-500">{ROLE_LABELS[user.role]}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
