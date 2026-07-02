"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, Shield, TrendingUp, ChevronRight, LogOut,
  Wallet, ArrowDownCircle, ArrowUpCircle, ScrollText, Briefcase, BarChart3, Activity,
  GitBranch, Gift, Trophy, Megaphone, LineChart, AlertTriangle, FileText, Target, UserCheck, PieChart, Bell, Mail,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

type NavItem =
  | { section: string }
  | { href: string; label: string; icon: React.ElementType };

const navItems: NavItem[] = [
  { href: "/diva-app-admin/dashboard",    label: "Dashboard",        icon: LayoutDashboard },
  { href: "/diva-app-admin/deposits",     label: "Deposits",         icon: ArrowDownCircle },
  { href: "/diva-app-admin/withdrawals",  label: "Withdrawals",      icon: ArrowUpCircle },
  { href: "/diva-app-admin/wallets",      label: "Wallets",          icon: Wallet },
  { href: "/diva-app-admin/portfolio",    label: "Portfolios",       icon: Briefcase },
  { href: "/diva-app-admin/users",        label: "Members",          icon: Users },
  { href: "/diva-app-admin/kyc",          label: "KYC Queue",        icon: Shield },
  { href: "/diva-app-admin/audit-logs",   label: "Audit Logs",       icon: ScrollText },
  { section: "Analytics & BI" },
  { href: "/diva-app-admin/analytics",               label: "Executive Dashboard", icon: LineChart },
  { href: "/diva-app-admin/analytics/users",         label: "User Analytics",      icon: Users },
  { href: "/diva-app-admin/analytics/deposits",      label: "Deposit Analytics",   icon: ArrowDownCircle },
  { href: "/diva-app-admin/analytics/withdrawals",   label: "Withdrawal Analytics",icon: ArrowUpCircle },
  { href: "/diva-app-admin/analytics/portfolio",     label: "Portfolio Analytics", icon: Briefcase },
  { href: "/diva-app-admin/analytics/referrals",     label: "Referral Analytics",  icon: GitBranch },
  { href: "/diva-app-admin/analytics/community",     label: "Community Analytics", icon: PieChart },
  { href: "/diva-app-admin/analytics/kpis",          label: "KPI Monitor",         icon: Target },
  { href: "/diva-app-admin/analytics/audit",         label: "Audit Logs",          icon: ScrollText },
  { href: "/diva-app-admin/analytics/alerts",        label: "System Alerts",       icon: AlertTriangle },
  { href: "/diva-app-admin/analytics/reports",       label: "Report Builder",      icon: FileText },
  { section: "Notifications & Email" },
  { href: "/diva-app-admin/notifications",   label: "Notification Center", icon: Bell },
  { href: "/diva-app-admin/email-settings",  label: "Email Settings",      icon: Mail },
  { section: "Growth & Community" },
  { href: "/diva-app-admin/referrals",    label: "Referrals",        icon: GitBranch },
  { href: "/diva-app-admin/rewards",      label: "Rewards Engine",   icon: Gift },
  { href: "/diva-app-admin/achievements", label: "Achievements",     icon: Trophy },
  { href: "/diva-app-admin/community",    label: "Announcements",    icon: Megaphone },
];

export function DivaAdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen sticky top-0 w-64 flex-col border-r border-white/[0.05] bg-black/40 backdrop-blur-xl overflow-y-auto">
      <div className="flex items-center gap-3 border-b border-white/[0.05] px-6 py-5 flex-shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8962E]">
          <TrendingUp className="h-5 w-5 text-black" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">STICKO Admin</p>
          <p className="text-[10px] text-[#D4AF37]">Control Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item, i) => {
          if ("section" in item) {
            return (
              <p key={`sec-${i}`} className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/20">
                {item.section}
              </p>
            );
          }
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
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
