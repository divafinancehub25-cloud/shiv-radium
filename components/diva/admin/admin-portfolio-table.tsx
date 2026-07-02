"use client";
import { useState, useTransition } from "react";
import { GlassCard } from "@/components/diva/ui/glass-card";
import { Search, ChevronLeft, ChevronRight, Eye, TrendingUp, TrendingDown, Settings } from "lucide-react";
import Link from "next/link";
import type { DivaPortfolioStatus } from "@prisma/client";

type PortfolioRow = {
  id: string;
  userId: string;
  currentBalance: string | { toString(): string };
  availableBalance: string | { toString(): string };
  status: DivaPortfolioStatus;
  updatedAt: Date | string;
  user: { id: string; name: string; email: string };
  _count?: { ledgerEntries: number };
};

type Props = {
  portfolios: PortfolioRow[];
  total: number;
  page: number;
  pages: number;
  onSearch: (q: string) => void;
  onPageChange: (p: number) => void;
};

const statusColors: Record<DivaPortfolioStatus, string> = {
  ACTIVE: "text-emerald-400 bg-emerald-400/10",
  SUSPENDED: "text-yellow-400 bg-yellow-400/10",
  FROZEN: "text-blue-400 bg-blue-400/10",
  CLOSED: "text-red-400 bg-red-400/10",
};

function fmt(v: string | { toString(): string }) {
  return Number(v.toString()).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

export function AdminPortfolioTable({ portfolios, total, page, pages, onSearch, onPageChange }: Props) {
  const [q, setQ] = useState("");

  return (
    <GlassCard className="overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div>
          <h3 className="text-sm font-semibold text-white">Member Portfolios</h3>
          <p className="text-xs text-white/30 mt-0.5">{total} portfolios</p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); onSearch(e.target.value); }}
            placeholder="Search member..."
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-[#D4AF37]/40 w-44"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/30 text-xs border-b border-white/[0.04]">
              <th className="px-6 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Balance</th>
              <th className="px-4 py-3 font-medium">Available</th>
              <th className="px-4 py-3 font-medium">Txns</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {portfolios.map((p) => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-3">
                  <p className="text-white text-sm font-medium">{p.user.name}</p>
                  <p className="text-white/30 text-xs">{p.user.email}</p>
                </td>
                <td className="px-4 py-3 text-[#D4AF37] font-mono font-semibold">${fmt(p.currentBalance)}</td>
                <td className="px-4 py-3 text-white/60 font-mono">${fmt(p.availableBalance)}</td>
                <td className="px-4 py-3 text-white/40">{p._count?.ledgerEntries ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status]}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-white/30 text-xs">{new Date(p.updatedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/diva-app-admin/portfolio/${p.userId}`}
                    className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] transition-colors"
                    title="View portfolio"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.06]">
          <span className="text-xs text-white/30">Page {page} of {pages}</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
              className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-30 flex items-center justify-center text-white/60">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button disabled={page >= pages} onClick={() => onPageChange(page + 1)}
              className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-30 flex items-center justify-center text-white/60">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
