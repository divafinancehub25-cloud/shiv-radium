"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: string;
  roles: Role[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "⊡", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Bookings", href: "/admin/bookings", icon: "📋", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Vehicles", href: "/admin/vehicles", icon: "🚗", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Drivers", href: "/admin/drivers", icon: "👤", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Customers", href: "/admin/customers", icon: "👥", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Pricing", href: "/admin/pricing", icon: "₹", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Invoices", href: "/admin/invoices", icon: "🧾", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Blog", href: "/admin/blog", icon: "✍️", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Reports", href: "/admin/reports", icon: "📊", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Settings", href: "/admin/settings", icon: "⚙️", roles: ["SUPER_ADMIN"] },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: "🔍", roles: ["SUPER_ADMIN"] },
];

export function AdminSidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  const visible = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-[#111111] border-r border-zinc-800 flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-800">
        <span className="text-white font-bold text-lg tracking-tight">
          BMW<span className="text-[#1C69D4]">Rental</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visible.map((item) => {
          const active =
            item.href === "/admin/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-[#1C69D4]/20 text-[#1C69D4]"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              )}
            >
              <span className="w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-600 text-center">BMW Rental v1.0</p>
      </div>
    </aside>
  );
}
