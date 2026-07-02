"use client";
import { useEffect, useState, useCallback } from "react";
import { adminPortfolioStats, adminListPortfolios } from "@/actions/diva/portfolio";
import { PortfolioAnalytics } from "@/components/diva/admin/portfolio-analytics";
import { AdminPortfolioTable } from "@/components/diva/admin/admin-portfolio-table";
import { Loader2 } from "lucide-react";
import type { DivaPortfolioStatus } from "@prisma/client";

type PortfolioRow = {
  id: string;
  userId: string;
  currentBalance: any;
  availableBalance: any;
  status: DivaPortfolioStatus;
  updatedAt: Date | string;
  user: { id: string; name: string; email: string };
  _count?: { ledgerEntries: number };
};

export default function AdminPortfolioPage() {
  const [stats, setStats] = useState<any>(null);
  const [portfolios, setPortfolios] = useState<PortfolioRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    const res = await adminPortfolioStats();
    if (!("error" in res)) setStats(res);
  }, []);

  const loadPortfolios = useCallback(async (p = 1, q = "") => {
    const res = await adminListPortfolios(p, 20, q || undefined);
    if ("portfolios" in res) {
      setPortfolios(res.portfolios as any);
      setTotal(res.total ?? 0);
      setPage(res.page ?? 1);
      setPages(res.pages ?? 1);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadPortfolios(1, "")]);
    setLoading(false);
  }, [loadStats, loadPortfolios]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    loadPortfolios(1, q);
  }, [loadPortfolios]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Portfolio Management</h1>
        <p className="text-sm text-white/40 mt-0.5">Platform-wide portfolio overview and analytics</p>
      </div>

      {stats && <PortfolioAnalytics stats={stats} />}

      <AdminPortfolioTable
        portfolios={portfolios}
        total={total}
        page={page}
        pages={pages}
        onSearch={handleSearch}
        onPageChange={(p) => loadPortfolios(p, search)}
      />
    </div>
  );
}
