"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWithdrawalSummary, createWithdrawal, getUserWithdrawals, cancelWithdrawal,
  adminListWithdrawals, reviewWithdrawal, adminWithdrawalStats,
} from "@/actions/diva/withdrawals";

export const WITHDRAWAL_KEYS = {
  summary: ["diva", "withdrawal", "summary"] as const,
  list: (page: number, status: string, search: string) => ["diva", "withdrawal", "list", page, status, search] as const,
  adminList: (page: number, status: string, search: string) => ["diva", "withdrawal", "admin", page, status, search] as const,
  stats: ["diva", "withdrawal", "stats"] as const,
};

const POLL = 15_000; // realtime-ish polling

export function useWithdrawalSummary() {
  return useQuery({
    queryKey: WITHDRAWAL_KEYS.summary,
    queryFn: async () => {
      const res = await getWithdrawalSummary();
      if ("error" in res) throw new Error(res.error);
      return res.summary;
    },
    refetchInterval: POLL,
  });
}

export function useUserWithdrawals(page = 1, status = "ALL", search = "") {
  return useQuery({
    queryKey: WITHDRAWAL_KEYS.list(page, status, search),
    queryFn: async () => {
      const res = await getUserWithdrawals({ page, status, search });
      if ("error" in res) throw new Error(res.error);
      return res;
    },
    refetchInterval: POLL,
  });
}

export function useCreateWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createWithdrawal>[0]) => createWithdrawal(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WITHDRAWAL_KEYS.summary });
      qc.invalidateQueries({ queryKey: ["diva", "withdrawal", "list"] });
    },
  });
}

export function useCancelWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelWithdrawal({ withdrawalId: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WITHDRAWAL_KEYS.summary });
      qc.invalidateQueries({ queryKey: ["diva", "withdrawal", "list"] });
    },
  });
}

export function useAdminWithdrawals(page = 1, status = "ALL", search = "") {
  return useQuery({
    queryKey: WITHDRAWAL_KEYS.adminList(page, status, search),
    queryFn: async () => {
      const res = await adminListWithdrawals({ page, status, search });
      if ("error" in res) throw new Error(res.error);
      return res;
    },
    refetchInterval: POLL,
  });
}

export function useReviewWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof reviewWithdrawal>[0]) => reviewWithdrawal(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["diva", "withdrawal", "admin"] });
      qc.invalidateQueries({ queryKey: WITHDRAWAL_KEYS.stats });
    },
  });
}

export function useWithdrawalStats() {
  return useQuery({
    queryKey: WITHDRAWAL_KEYS.stats,
    queryFn: async () => {
      const res = await adminWithdrawalStats();
      if ("error" in res) throw new Error(res.error);
      return res.stats;
    },
    refetchInterval: POLL,
  });
}
