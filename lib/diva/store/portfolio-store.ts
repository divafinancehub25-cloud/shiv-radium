import { create } from "zustand";
import type { DivaPortfolioStatus } from "@prisma/client";

type Portfolio = {
  id: string;
  currentBalance: string;
  availableBalance: string;
  lockedBalance: string;
  status: DivaPortfolioStatus;
};

type PortfolioStore = {
  portfolio: Portfolio | null;
  isLoading: boolean;
  setPortfolio: (p: Portfolio | null) => void;
  setLoading: (v: boolean) => void;
  refresh: () => void;
  _refreshKey: number;
};

export const usePortfolioStore = create<PortfolioStore>((set) => ({
  portfolio: null,
  isLoading: false,
  _refreshKey: 0,
  setPortfolio: (portfolio) => set({ portfolio }),
  setLoading: (isLoading) => set({ isLoading }),
  refresh: () => set((s) => ({ _refreshKey: s._refreshKey + 1 })),
}));
