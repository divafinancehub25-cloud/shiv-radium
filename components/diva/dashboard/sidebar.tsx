"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, User, Shield, Settings, LogOut, TrendingUp, ChevronRight,
  ArrowDownCircle, ArrowUpCircle, Clock, Briefcase, FileText, Calculator, Flag, BarChart3,
  Download, Layers,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

type NavItem =
  | { section: string }
  | { href: string; label: string; icon: React.ElementType };

const navItems: NavItem[] = [
  { href: "/diva-app/dashboard",              label: "Dashboard",       icon: LayoutDashboard },
  { href: "/diva-app/portfolio",              label: "Portfolio",        icon: Briefcase },
  { href: "/diva-app/portfolio/transactions", label: "Transactions",     icon: FileText },
  { href: "/diva-app/deposit",                label: "Deposit",          icon: ArrowDownCircle },
  { href: "/diva-app/deposit/history",        label: "Deposit History",  icon: Clock },
  { href: "/diva-app/withdraw",               label: "Withdraw",         icon: ArrowUpCircle },
  { href: "/diva-app/withdraw/history",       label: "Withdraw History", icon: Clock },
  { section: "Forecasting" },
  { href: "/diva-app/forecasting",            label: "Forecast Hub",     icon: TrendingUp },
  { href: "/diva-app/forecasting/calculator", label: "Calculator",       icon: Calculator },
  { href: "/diva-app/forecasting/scenarios",  label: "Scenarios",        icon: Layers },
  { href: "/diva-app/forecasting/dashboard",  label: "Forecast View",    icon: BarChart3 },
  { href: "/diva-app/forecasting/milestones", label: "Milestones",       icon: Flag },
  { href: "/diva-app/forecasting/export",     label: "Export",           icon: Download },
  { section: "Account" },
  { href: "/diva-app/profile",                label: "Profile",          icon: User },
  { href: "/diva-app/kyc",                    label: "KYC Verification", icon: Shield },
  { href: "/diva-app/settings",               label: "Settings",         icon: Settings },
];

export function DivaPortalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen sticky top-0 w-64 flex-col border-r border-white/[0.05] bg-black/40 backdrop-blur-xl overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-white/[0.05] px-6 py-5 flex-shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8962E]">
          <TrendingUp className="h-5 w-5 text-black" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">DIVA</p>
          <p className="text-[10px] text-[#D4AF37]">Growth Capital</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item, i) => {
          if ("section" in item) {
            return (
              <p key={`sec-${i}`} className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/20">
                {item.section}
              </p>
            );
          }
          const active =
            pathname === item.href ||
            pathname.startsWith(item.href + "/") ||
            (item.href === "/diva-app/dashboard" && pathname === "/diva-app");
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                    : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="h-3 w-3" />}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Signout */}
      <div className="border-t border-white/[0.05] p-3 flex-shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: "/diva-app/login" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500 transition-all hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
