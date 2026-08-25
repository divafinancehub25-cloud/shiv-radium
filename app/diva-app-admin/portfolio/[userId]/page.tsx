"use client";
import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import { adminGetUserPortfolio, adminGetUserLedger } from "@/actions/diva/portfolio";
import { adminGetMemberFull } from "@/actions/diva/admin";
import { PortfolioBalanceCard } from "@/components/diva/portfolio/portfolio-balance-card";
import { LedgerTable } from "@/components/diva/portfolio/ledger-table";
import { AdminBalanceControls } from "@/components/diva/admin/admin-balance-controls";
import { AdminMemberEdit } from "@/components/diva/admin/admin-member-edit";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Loader2, ArrowLeft, User, ShieldCheck, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import Link from "next/link";
import type { DivaPortfolioStatus, DivaLedgerType } from "@prisma/client";

type Props = { params: Promise<{ userId: string }> };

type LedgerEntry = {
  id: string;
  transactionType: DivaLedgerType;
  amount: any;
  previousBalance: any;
  newBalance: any;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: Date | string;
  creator?: { id: string; name: string } | null;
};

export default function AdminUserPortfolioPage({ params }: Props) {
  const { userId } = use(params);

  const [data, setData] = useState<{
    portfolio: any | null;
    user: { id: string; name: string; email: string; createdAt: Date | string } | null;
  }>({ portfolio: null, user: null });
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    const [d, l, m] = await Promise.all([
      adminGetUserPortfolio(userId),
      adminGetUserLedger(userId, p, 20),
      adminGetMemberFull(userId),
    ]);
    if (!("error" in d)) setData(d as any);
    if (!("error" in m)) setMember(m as any);
    if ("entries" in l) {
      setEntries(l.entries as any);
      setTotal(l.total ?? 0);
      setPage(l.page ?? 1);
      setPages(l.pages ?? 1);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (!data.user) {
    return (
      <div className="p-6 text-center text-white/40">
        <p>User not found</p>
        <Link href="/diva-app-admin/portfolio" className="text-[#D4AF37] text-sm mt-3 inline-block">← Back to Portfolios</Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/diva-app-admin/portfolio" className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-white/60 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{data.user.name}</h1>
          <p className="text-xs text-white/30">{data.user.email} · Member since {new Date(data.user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: portfolio + ledger */}
        <div className="lg:col-span-2 space-y-6">
          {data.portfolio ? (
            <PortfolioBalanceCard
              currentBalance={data.portfolio.currentBalance.toString()}
              availableBalance={data.portfolio.availableBalance.toString()}
              lockedBalance={data.portfolio.lockedBalance.toString()}
              status={data.portfolio.status as DivaPortfolioStatus}
            />
          ) : (
            <GlassCard className="p-8 text-center">
              <User className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No portfolio yet — will be created on first deposit</p>
            </GlassCard>
          )}

          {/* Member overview — KYC + recent deposits/withdrawals */}
          {member && (
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" /> Member Overview
                </h3>
                <span className={`text-xs px-2.5 py-1 rounded-full ${member.user?.divaKYC?.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                  KYC: {member.user?.divaKYC?.status ?? "NONE"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-white/[0.03] p-3">
                  <p className="text-white/40 mb-1 flex items-center gap-1"><ArrowDownCircle className="w-3.5 h-3.5" /> Deposits</p>
                  <p className="text-white font-semibold">{member.deposits?.length ?? 0} recent</p>
                  {member.deposits?.slice(0, 3).map((d: any) => (
                    <p key={d.id} className="text-white/50 mt-1">{String(d.amount)} {d.coinType} · <span className="text-white/30">{d.status}</span></p>
                  ))}
                </div>
                <div className="rounded-xl bg-white/[0.03] p-3">
                  <p className="text-white/40 mb-1 flex items-center gap-1"><ArrowUpCircle className="w-3.5 h-3.5" /> Withdrawals</p>
                  <p className="text-white font-semibold">{member.withdrawals?.length ?? 0} recent</p>
                  {member.withdrawals?.slice(0, 3).map((w: any) => (
                    <p key={w.id} className="text-white/50 mt-1">{String(w.amount)} · <span className="text-white/30">{w.status}</span></p>
                  ))}
                </div>
              </div>
              <p className="text-xs text-white/30 mt-3">
                Phone: {member.user?.phone ?? "—"} · Country: {member.user?.divaProfile?.country ?? "—"} · Wallet: {member.user?.divaProfile?.walletAddress ? "set" : "—"}
              </p>
            </GlassCard>
          )}

          <LedgerTable
            entries={entries}
            total={total}
            page={page}
            pages={pages}
            onPageChange={(p) => load(p)}
          />
        </div>

        {/* Right: admin controls + member edit */}
        <div className="space-y-6">
          <AdminBalanceControls
            userId={userId}
            userName={data.user.name}
            currentStatus={data.portfolio?.status ?? "ACTIVE"}
            onSuccess={() => load(page)}
          />
          {member?.user && (
            <AdminMemberEdit
              member={{
                id: member.user.id,
                name: member.user.name,
                email: member.user.email,
                phone: member.user.phone,
                isActive: member.user.isActive,
                profile: member.user.divaProfile,
              }}
              onSuccess={() => load(page)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
