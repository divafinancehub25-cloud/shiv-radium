import { getExecutiveSummary } from "@/actions/diva/analytics";
import { getKpiCards } from "@/actions/diva/kpi";
import { getAlerts } from "@/actions/diva/alerts";
import { ExecStatCard } from "@/components/diva/analytics/exec-stat-card";
import { KpiCardWidget } from "@/components/diva/analytics/kpi-card";
import { GlassCard } from "@/components/diva/ui/glass-card";
import {
  Users, UserCheck, ArrowDownCircle, ArrowUpCircle,
  Briefcase, GitBranch, AlertTriangle, TrendingUp, DollarSign, Trophy,
} from "lucide-react";
import Link from "next/link";

function fmt(n: number, prefix = "") {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${n.toLocaleString()}`;
}

export default async function AnalyticsDashboardPage() {
  const [summaryRes, kpiRes, alertsRes] = await Promise.all([
    getExecutiveSummary(),
    getKpiCards(),
    getAlerts("OPEN"),
  ]);

  const s = summaryRes.data;
  const kpis = kpiRes.data ?? [];
  const alerts = "data" in alertsRes ? alertsRes : { data: [], openCount: 0, criticalCount: 0 };

  const quickLinks = [
    { label: "User Analytics", href: "/diva-app-admin/analytics/users", color: "text-blue-400" },
    { label: "Deposit Analytics", href: "/diva-app-admin/analytics/deposits", color: "text-emerald-400" },
    { label: "Withdrawal Analytics", href: "/diva-app-admin/analytics/withdrawals", color: "text-orange-400" },
    { label: "Portfolio Analytics", href: "/diva-app-admin/analytics/portfolio", color: "text-purple-400" },
    { label: "Referral Analytics", href: "/diva-app-admin/analytics/referrals", color: "text-pink-400" },
    { label: "Community Analytics", href: "/diva-app-admin/analytics/community", color: "text-cyan-400" },
    { label: "KPI Monitor", href: "/diva-app-admin/analytics/kpis", color: "text-[#D4AF37]" },
    { label: "Audit Logs", href: "/diva-app-admin/analytics/audit", color: "text-white/60" },
    { label: "System Alerts", href: "/diva-app-admin/analytics/alerts", color: "text-red-400" },
    { label: "Report Builder", href: "/diva-app-admin/analytics/reports", color: "text-indigo-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Executive Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">STICKO Growth Capital — Business Intelligence Center</p>
        </div>
        {(alerts.criticalCount ?? 0) > 0 && (
          <Link href="/diva-app-admin/analytics/alerts" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors">
            <AlertTriangle className="w-4 h-4" />
            {alerts.criticalCount} Critical Alert{(alerts.criticalCount ?? 0) > 1 ? "s" : ""}
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      {kpis.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-white/30 uppercase tracking-wider font-medium">KPI Monitor</p>
            <Link href="/diva-app-admin/analytics/kpis" className="text-xs text-[#D4AF37] hover:underline">Manage KPIs →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {kpis.slice(0, 4).map((k) => <KpiCardWidget key={k.id} kpi={k} />)}
          </div>
        </div>
      )}

      {/* Executive Stats */}
      {s && (
        <>
          <div>
            <p className="text-xs text-white/30 uppercase tracking-wider font-medium mb-3">Platform Overview</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ExecStatCard label="Total Users" value={s.totalUsers} sub={`+${s.newUsersThisMonth} this month`} icon={Users} iconColor="text-blue-400" iconBg="bg-blue-400/10" />
              <ExecStatCard label="KYC Verified" value={s.verifiedUsers} sub={`${s.kycRate}% rate`} icon={UserCheck} iconColor="text-emerald-400" iconBg="bg-emerald-400/10" />
              <ExecStatCard label="Total Deposits" value={s.totalDeposits} sub={fmt(s.depositVolume, "$")} icon={ArrowDownCircle} iconColor="text-[#D4AF37]" iconBg="bg-[#D4AF37]/10" />
              <ExecStatCard label="Active Portfolios" value={s.activePortfolios} sub={fmt(s.totalPortfolioValue, "$") + " value"} icon={Briefcase} iconColor="text-purple-400" iconBg="bg-purple-400/10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ExecStatCard label="Total Withdrawals" value={s.totalWithdrawals} sub={fmt(s.withdrawVolume, "$")} icon={ArrowUpCircle} iconColor="text-orange-400" iconBg="bg-orange-400/10" />
            <ExecStatCard label="Portfolio Value" value={fmt(s.totalPortfolioValue, "$")} sub={`${s.activePortfolios} active`} icon={DollarSign} iconColor="text-emerald-400" iconBg="bg-emerald-400/10" />
            <ExecStatCard label="Total Referrals" value={s.totalReferrals} sub={`${s.referralConversion}% conversion`} icon={GitBranch} iconColor="text-pink-400" iconBg="bg-pink-400/10" />
            <ExecStatCard label="Open Alerts" value={s.openAlerts} sub="Needs attention" icon={AlertTriangle} iconColor="text-red-400" iconBg="bg-red-400/10" />
          </div>
        </>
      )}

      {/* Quick Links */}
      <GlassCard className="p-6">
        <p className="text-sm font-semibold text-white mb-4">Analytics Modules</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] transition-colors"
            >
              <TrendingUp className={`w-3.5 h-3.5 ${l.color} shrink-0`} />
              <span className="text-xs text-white/60 leading-tight">{l.label}</span>
            </Link>
          ))}
        </div>
      </GlassCard>

      {/* Recent Alerts */}
      {(alerts.data?.length ?? 0) > 0 && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-white">Open Alerts</p>
            <Link href="/diva-app-admin/analytics/alerts" className="text-xs text-[#D4AF37] hover:underline">View All →</Link>
          </div>
          <div className="space-y-3">
            {(alerts.data ?? []).slice(0, 5).map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${a.severity === "CRITICAL" ? "bg-red-400" : a.severity === "WARNING" ? "bg-yellow-400" : "bg-blue-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{a.title}</p>
                  <p className="text-white/30 text-[10px] truncate">{a.message}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${a.severity === "CRITICAL" ? "text-red-400 bg-red-400/10" : a.severity === "WARNING" ? "text-yellow-400 bg-yellow-400/10" : "text-blue-400 bg-blue-400/10"}`}>
                  {a.severity}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
