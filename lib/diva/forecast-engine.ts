/**
 * Pure financial math engine — no side effects, fully testable.
 * All monetary inputs/outputs are plain numbers (USD).
 */
import type { ForecastInput, ForecastResult, DataPoint, CompoundingFreq, ContribFreq } from "@/types/diva/forecasting";

const N_PER_YEAR: Record<CompoundingFreq, number> = {
  DAILY: 365,
  MONTHLY: 12,
  QUARTERLY: 4,
  ANNUALLY: 1,
};

const CONTRIB_PER_YEAR: Record<ContribFreq, number> = {
  MONTHLY: 12,
  QUARTERLY: 4,
  ANNUALLY: 1,
};

/**
 * Future Value with periodic contributions.
 * FV = PV*(1+r/n)^(n*t) + PMT * [((1+r/n)^(n*t) - 1) / (r/n)]
 */
export function calcForecast(input: ForecastInput): ForecastResult {
  const {
    initialAmount,
    contributionAmount,
    contributionFreq,
    durationYears,
    growthRate,
    compoundingFreq,
  } = input;

  const r = growthRate / 100; // annual decimal rate
  const n = N_PER_YEAR[compoundingFreq]; // compounding periods/year
  const rPeriod = r / n; // rate per compounding period

  const contribPerYear = CONTRIB_PER_YEAR[contributionFreq];
  const totalContributions = contributionAmount * contribPerYear * durationYears;

  const dataPoints: DataPoint[] = [];

  // Generate yearly data points
  for (let year = 0; year <= durationYears; year++) {
    const periods = n * year;

    // FV of principal
    const fvPrincipal =
      r === 0
        ? initialAmount
        : initialAmount * Math.pow(1 + rPeriod, periods);

    // FV of contributions (annuity due — contributions at start of period)
    let fvContrib = 0;
    if (contributionAmount > 0 && r > 0) {
      // Effective rate per contribution interval
      const periodsPerContrib = n / contribPerYear;
      const rContrib = Math.pow(1 + rPeriod, periodsPerContrib) - 1;
      const numContribs = contribPerYear * year;
      fvContrib =
        contributionAmount *
        ((Math.pow(1 + rContrib, numContribs) - 1) / rContrib) *
        (1 + rContrib);
    } else if (r === 0) {
      fvContrib = contributionAmount * contribPerYear * year;
    }

    const balance = fvPrincipal + fvContrib;
    const contributions = contributionAmount * contribPerYear * year;
    const growth = balance - initialAmount - contributions;

    dataPoints.push({
      year,
      label: year === 0 ? "Now" : `Year ${year}`,
      balance: Math.max(0, balance),
      contributions: Math.max(0, contributions),
      growth: Math.max(0, growth),
      principal: initialAmount,
    });
  }

  const last = dataPoints[dataPoints.length - 1];
  const projectedValue = last.balance;
  const estimatedGrowth = projectedValue - initialAmount - totalContributions;

  // CAGR
  const cagr =
    durationYears > 0 && initialAmount > 0
      ? (Math.pow(projectedValue / Math.max(initialAmount, 1), 1 / durationYears) - 1) * 100
      : 0;

  return {
    projectedValue,
    totalContributions,
    estimatedGrowth: Math.max(0, estimatedGrowth),
    principal: initialAmount,
    dataPoints,
    cagr,
  };
}

/** Generate monthly data points for a smoother chart */
export function calcForecastMonthly(input: ForecastInput): DataPoint[] {
  const { initialAmount, contributionAmount, contributionFreq, durationYears, growthRate, compoundingFreq } = input;
  const r = growthRate / 100;
  const n = N_PER_YEAR[compoundingFreq];
  const rPeriod = r / n;
  const contribPerYear = CONTRIB_PER_YEAR[contributionFreq];
  const months = durationYears * 12;
  const points: DataPoint[] = [];

  for (let m = 0; m <= months; m++) {
    const t = m / 12;
    const periods = n * t;
    const fvPrincipal = r === 0 ? initialAmount : initialAmount * Math.pow(1 + rPeriod, periods);
    let fvContrib = 0;
    if (contributionAmount > 0 && r > 0 && m > 0) {
      const periodsPerContrib = n / contribPerYear;
      const rContrib = Math.pow(1 + rPeriod, periodsPerContrib) - 1;
      const numContribs = contribPerYear * t;
      fvContrib = contributionAmount * ((Math.pow(1 + rContrib, numContribs) - 1) / rContrib) * (1 + rContrib);
    } else if (r === 0 && m > 0) {
      fvContrib = contributionAmount * contribPerYear * t;
    }
    const balance = fvPrincipal + fvContrib;
    const contributions = contributionAmount * contribPerYear * t;
    points.push({
      year: m,
      label: m === 0 ? "Now" : `M${m}`,
      balance: Math.max(0, balance),
      contributions: Math.max(0, contributions),
      growth: Math.max(0, balance - initialAmount - contributions),
      principal: initialAmount,
    });
  }
  return points;
}

/** Estimate how many years to reach a target amount */
export function estimateYearsToTarget(
  currentBalance: number,
  targetAmount: number,
  monthlyContribution: number,
  annualRate: number
): number | null {
  if (targetAmount <= currentBalance) return 0;
  if (annualRate <= 0 && monthlyContribution <= 0) return null;

  const r = annualRate / 100 / 12;
  // Solve by iteration (max 100 years)
  for (let months = 1; months <= 1200; months++) {
    const fvP = r === 0 ? currentBalance : currentBalance * Math.pow(1 + r, months);
    const fvC = r === 0
      ? monthlyContribution * months
      : monthlyContribution * ((Math.pow(1 + r, months) - 1) / r);
    if (fvP + fvC >= targetAmount) return months / 12;
  }
  return null;
}

/** Scenario comparison — compute all at once */
export function compareScenarios(inputs: ForecastInput[]): ForecastResult[] {
  return inputs.map(calcForecast);
}

/** Format large numbers compactly */
export function fmtMoney(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

export function fmtPct(v: number): string {
  return `${v.toFixed(2)}%`;
}
