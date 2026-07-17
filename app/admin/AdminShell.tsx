"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, ShoppingBag, Package, Tag, Settings, MoreVertical } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminShell({ children, logo, name = "Shiv Radium" }: { children: React.ReactNode; logo?: string | null; name?: string }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Three-dot toggle — always visible */}
      <button
        onClick={() => setOpen((o) => !o)}
        title={open ? "Sidebar hide karo" : "Sidebar kholo"}
        className={`fixed top-4 z-50 bg-gray-900 text-white p-2 rounded-lg shadow-lg hover:bg-gray-700 transition-all ${open ? "left-[13rem]" : "left-3"}`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Sidebar */}
      <aside className={`w-56 bg-gray-900 text-white fixed h-full flex flex-col z-40 transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-gray-800">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={name} className="h-10 w-auto object-contain bg-white rounded-lg p-1" />
          ) : (
            <p className="text-orange-400 font-bold text-lg">{name}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← View Website
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 min-h-screen transition-all duration-200 ${open ? "ml-56" : "ml-0"}`}>
        {children}
      </main>
    </div>
  );
}
