import { create } from "zustand";
import type { ForecastInput, ForecastResult, ScenarioRow } from "@/types/diva/forecasting";
import { calcForecast } from "@/lib/diva/forecast-engine";

type ForecastingStore = {
  // Calculator state
  calcInput: ForecastInput;
  calcResult: ForecastResult | null;
  setCalcInput: (input: Partial<ForecastInput>) => void;
  runCalc: () => void;

  // Scenario comparison (up to 3)
  compareScenarios: (ForecastInput & { name: string; color: string })[];
  setCompareScenarios: (s: (ForecastInput & { name: string; color: string })[]) => void;

  // Active scenario for detail view
  activeScenario: ScenarioRow | null;
  setActiveScenario: (s: ScenarioRow | null) => void;

  // Historical filter
  historicalRange: "7d" | "30d" | "90d" | "1y" | "all";
  setHistoricalRange: (r: "7d" | "30d" | "90d" | "1y" | "all") => void;
};

const DEFAULT_INPUT: ForecastInput = {
  initialAmount: 10000,
  contributionAmount: 500,
  contributionFreq: "MONTHLY",
  durationYears: 10,
  growthRate: 8,
  compoundingFreq: "MONTHLY",
};

export const useForecastingStore = create<ForecastingStore>((set, get) => ({
  calcInput: DEFAULT_INPUT,
  calcResult: calcForecast(DEFAULT_INPUT),

  setCalcInput: (partial) => {
    const input = { ...get().calcInput, ...partial };
    set({ calcInput: input, calcResult: calcForecast(input) });
  },

  runCalc: () => {
    const input = get().calcInput;
    set({ calcResult: calcForecast(input) });
  },

  compareScenarios: [
    { ...DEFAULT_INPUT, name: "Conservative", growthRate: 5, color: "#34d399" },
    { ...DEFAULT_INPUT, name: "Moderate", growthRate: 8, color: "#D4AF37" },
    { ...DEFAULT_INPUT, name: "Aggressive", growthRate: 12, color: "#f87171" },
  ],
  setCompareScenarios: (s) => set({ compareScenarios: s }),

  activeScenario: null,
  setActiveScenario: (s) => set({ activeScenario: s }),

  historicalRange: "30d",
  setHistoricalRange: (r) => set({ historicalRange: r }),
}));
