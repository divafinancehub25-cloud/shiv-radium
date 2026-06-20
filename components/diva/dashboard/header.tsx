"use client";

import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { NotificationBell } from "./notification-bell";

type Props = { onMenuClick?: () => void };

export function DivaHeader({ onMenuClick }: Props) {
  const { data: session } = useSession();
  const initial = session?.user?.name?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/[0.05] bg-black/20 px-6 backdrop-blur-xl">
      <button onClick={onMenuClick} className="text-zinc-500 hover:text-white lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden text-sm text-zinc-500 lg:block">
        Welcome back,{" "}
        <span className="font-medium text-white">{session?.user?.name ?? "Investor"}</span>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8962E] text-sm font-bold text-black">
          {initial}
        </div>
      </div>
    </header>
  );
}
