import type {
  DivaForecastScenario,
  DivaForecastResult,
  DivaUserMilestone,
  DivaMilestoneStatus,
  DivaCompoundingFreq,
  DivaContributionFreq,
} from "@prisma/client";

export type { DivaMilestoneStatus, DivaCompoundingFreq, DivaContributionFreq };
export type DivaContribFreq = DivaContributionFreq;

// ─── Engine types ─────────────────────────────────────────────────────────────

export type CompoundingFreq = "DAILY" | "MONTHLY" | "QUARTERLY" | "ANNUALLY";
export type ContribFreq = "MONTHLY" | "QUARTERLY" | "ANNUALLY";

export type ForecastInput = {
  initialAmount: number;
  contributionAmount: number;
  contributionFreq: ContribFreq;
  durationYears: number;
  growthRate: number; // 0–100 (percentage)
  compoundingFreq: CompoundingFreq;
};

export type DataPoint = {
  year: number;
  label: string;
  balance: number;
  contributions: number;
  growth: number;
  principal: number;
};

export type ForecastResult = {
  projectedValue: number;
  totalContributions: number;
  estimatedGrowth: number;
  principal: number;
  dataPoints: DataPoint[];
  cagr: number;
};

// ─── Scenario row ─────────────────────────────────────────────────────────────

export type ScenarioRow = DivaForecastScenario & {
  results: DivaForecastResult[];
};

export type ScenarioWithResult = ScenarioRow & {
  computed?: ForecastResult;
};

// ─── Milestone ────────────────────────────────────────────────────────────────

export type MilestoneRow = DivaUserMilestone;

export type MilestoneProgress = {
  milestone: MilestoneRow;
  currentBalance: number;
  progressPct: number;
  remaining: number;
  estimatedDate: Date | null;
  daysLeft: number | null;
};

// ─── Insight card ─────────────────────────────────────────────────────────────

export type InsightCard = {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  color: string;
  icon: string;
};

// ─── Historical filter ────────────────────────────────────────────────────────

export type HistoricalRange = "7d" | "30d" | "90d" | "1y" | "all";

export type HistoricalPoint = {
  date: string;
  balance: number;
  deposits: number;
  adjustments: number;
};

// ─── Admin stats ──────────────────────────────────────────────────────────────

export type ForecastAdminStats = {
  totalScenarios: number;
  totalMilestones: number;
  activeUsers: number;
  avgGrowthRate: number;
  topScenarios: { scenarioName: string; count: number }[];
};

// ─── Forms ────────────────────────────────────────────────────────────────────

export type CreateScenarioInput = {
  scenarioName: string;
  initialAmount: number;
  contributionAmount: number;
  contributionFreq: ContribFreq;
  durationYears: number;
  growthRate: number;
  compoundingFreq: CompoundingFreq;
  color?: string;
};

export type CreateMilestoneInput = {
  milestoneName: string;
  targetAmount: number;
  targetDate?: string;
  notes?: string;
};
