import { create } from "zustand";
import type { WithdrawalNetwork, WithdrawalRow } from "@/types/diva/withdrawal";

type WithdrawalStore = {
  // Form draft state
  amount: string;
  walletAddress: string;
  network: WithdrawalNetwork;
  userNotes: string;
  setField: (patch: Partial<Pick<WithdrawalStore, "amount" | "walletAddress" | "network" | "userNotes">>) => void;
  resetForm: () => void;

  // History filters
  statusFilter: string;
  search: string;
  page: number;
  setStatusFilter: (s: string) => void;
  setSearch: (s: string) => void;
  setPage: (p: number) => void;

  // Last submitted (for success UI)
  lastSubmitted: WithdrawalRow | null;
  setLastSubmitted: (w: WithdrawalRow | null) => void;
};

export const useWithdrawalStore = create<WithdrawalStore>((set) => ({
  amount: "",
  walletAddress: "",
  network: "TRC20",
  userNotes: "",
  setField: (patch) => set(patch),
  resetForm: () => set({ amount: "", walletAddress: "", network: "TRC20", userNotes: "" }),

  statusFilter: "ALL",
  search: "",
  page: 1,
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
  setSearch: (search) => set({ search, page: 1 }),
  setPage: (page) => set({ page }),

  lastSubmitted: null,
  setLastSubmitted: (lastSubmitted) => set({ lastSubmitted }),
}));
