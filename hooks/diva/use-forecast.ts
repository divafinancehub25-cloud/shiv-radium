"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserScenarios, createScenario, updateScenario, deleteScenario,
  duplicateScenario, togglePinScenario,
  getUserMilestones, createMilestone, updateMilestone, deleteMilestone,
  getUserHistoricalData, getUserInsights,
} from "@/actions/diva/forecasting";

export const FORECAST_KEYS = {
  scenarios: ["diva", "scenarios"] as const,
  milestones: ["diva", "milestones"] as const,
  insights: ["diva", "insights"] as const,
  historical: (range: string) => ["diva", "historical", range] as const,
};

// ── Scenarios ──────────────────────────────────────────────────────────────────

export function useScenarios() {
  return useQuery({
    queryKey: FORECAST_KEYS.scenarios,
    queryFn: async () => {
      const res = await getUserScenarios();
      if ("error" in res) throw new Error(res.error);
      return res.scenarios;
    },
    staleTime: 30_000,
  });
}

export function useCreateScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createScenario>[0]) => createScenario(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: FORECAST_KEYS.scenarios }),
  });
}

export function useUpdateScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateScenario>[0]) => updateScenario(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: FORECAST_KEYS.scenarios }),
  });
}

export function useDeleteScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteScenario(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: FORECAST_KEYS.scenarios }),
  });
}

export function useDuplicateScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => duplicateScenario(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: FORECAST_KEYS.scenarios }),
  });
}

export function useTogglePinScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => togglePinScenario(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: FORECAST_KEYS.scenarios }),
  });
}

// ── Milestones ─────────────────────────────────────────────────────────────────

export function useMilestones() {
  return useQuery({
    queryKey: FORECAST_KEYS.milestones,
    queryFn: async () => {
      const res = await getUserMilestones();
      if ("error" in res) throw new Error(res.error);
      return res.milestones;
    },
    staleTime: 30_000,
  });
}

export function useCreateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createMilestone>[0]) => createMilestone(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: FORECAST_KEYS.milestones }),
  });
}

export function useUpdateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateMilestone>[0]) => updateMilestone(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: FORECAST_KEYS.milestones }),
  });
}

export function useDeleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMilestone(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: FORECAST_KEYS.milestones }),
  });
}

// ── Analytics ──────────────────────────────────────────────────────────────────

export function useInsights() {
  return useQuery({
    queryKey: FORECAST_KEYS.insights,
    queryFn: async () => {
      const res = await getUserInsights();
      if ("error" in res) throw new Error(res.error);
      return res;
    },
    staleTime: 60_000,
  });
}

export function useHistoricalData(range: "7d" | "30d" | "90d" | "1y" | "all" = "30d") {
  return useQuery({
    queryKey: FORECAST_KEYS.historical(range),
    queryFn: async () => {
      const res = await getUserHistoricalData(range);
      if ("error" in res) throw new Error(res.error);
      return res.points;
    },
    staleTime: 60_000,
  });
}
