export type PeriodFilter = "7d" | "30d" | "90d" | "1y";

export type ExecutiveSummary = {
  totalUsers: number;
  newUsersThisMonth: number;
  verifiedUsers: number;
  kycRate: number;
  totalDeposits: number;
  depositVolume: number;
  totalWithdrawals: number;
  withdrawVolume: number;
  activePortfolios: number;
  totalPortfolioValue: number;
  totalReferrals: number;
  activatedReferrals: number;
  referralConversion: number;
  openAlerts: number;
};

export type TimeSeriesPoint = { date: string; value: number };
export type MultiSeriesPoint = { date: string; [key: string]: number | string };

export type UserGrowthData = {
  series: TimeSeriesPoint[];
  totalUsers: number;
  newThisPeriod: number;
  growthRate: number;
};

export type DepositAnalyticsData = {
  volumeSeries: TimeSeriesPoint[];
  countSeries: TimeSeriesPoint[];
  totalVolume: number;
  totalCount: number;
  avgSize: number;
  networkBreakdown: { name: string; value: number; volume: number }[];
};

export type WithdrawalAnalyticsData = {
  volumeSeries: TimeSeriesPoint[];
  statusBreakdown: { name: string; value: number }[];
  totalVolume: number;
  totalCount: number;
  approvalRate: number;
  pendingCount: number;
};

export type PortfolioAnalyticsData = {
  totalValue: number;
  activeCount: number;
  valueSeries: TimeSeriesPoint[];
  statusBreakdown: { name: string; value: number }[];
  avgBalance: number;
};

export type ReferralAnalyticsData = {
  series: TimeSeriesPoint[];
  funnel: { stage: string; count: number; pct: number }[];
  topReferrers: { name: string; email: string; count: number; activated: number }[];
  conversionRate: number;
  totalRewards: number;
};

export type KpiCard = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  currentValue: number;
  target: number | null;
  warningAt: number | null;
  criticalAt: number | null;
  trend: number;
  status: "normal" | "warning" | "critical";
};

export type AlertRow = {
  id: string;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  alertType: string;
  createdAt: string;
  assigneeName: string | null;
};

export type ReportRow = {
  id: string;
  reportName: string;
  reportType: string;
  format: string;
  status: string;
  rowCount: number | null;
  generatorName: string | null;
  createdAt: string;
  fileUrl: string | null;
};

export type AuditRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  ipAddress: string | null;
  createdAt: string;
  metadata: any;
};
