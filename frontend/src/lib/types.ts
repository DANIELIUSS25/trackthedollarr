// ── API envelope ──
export interface ApiEnvelope<T> {
  data: T;
  metadata: Record<string, unknown>;
  warnings?: string[];
}

// ── Query params ──
export type ApiRange = "7d" | "30d" | "90d" | "180d" | "1y" | "2y" | "5y" | "10y" | "max";
export type ApiFrequency = "auto" | "daily" | "weekly" | "monthly" | "quarterly" | "annual";
export type CompareMode = "previous" | "1y" | "5y";

export interface SeriesQuery {
  range?: ApiRange;
  frequency?: ApiFrequency;
  compare?: CompareMode;
  limit?: number;
}

// ── Series payload ──
export interface SeriesMeta {
  slug: string;
  sourceCode: string;
  name: string;
  description: string;
  unit: string;
  frequency: string;
  category: string;
  source: string;
  sourceSlug: string;
  sourcePageUrl: string;
}

export interface Observation {
  observedAt: string;
  value: number | Record<string, unknown> | string | null;
  valueStatus: "PRELIMINARY" | "FINAL" | "REVISED";
  sourceUpdatedAt: string | null;
  warnings: string[];
}

export interface SeriesAnalytics {
  latest: { observedAt: string; value: number } | null;
  deltas: {
    "7d": number | null;
    "30d": number | null;
    "90d": number | null;
    "1y": number | null;
  };
  rollingAverage: number | null;
  annualizedChange: number | null;
  percentile: number | null;
  zScore: number | null;
}

export interface ComparisonResult {
  mode: string;
  baseObservedAt: string;
  absoluteChange: number;
  percentChange: number;
}

export interface FreshnessInfo {
  freshnessStatus: "FRESH" | "STALE" | "UNKNOWN";
  stale: boolean;
  lastObservationAt: string | null;
  lastSuccessfulSyncAt: string | null;
}

export interface MethodologyRef {
  slug: string;
  title: string;
  summary: string;
  limitations: string | null;
}

export interface SeriesPayload {
  series: SeriesMeta;
  observations: Observation[];
  analytics: SeriesAnalytics | null;
  comparison: ComparisonResult | null;
  freshness: FreshnessInfo;
  methodology: MethodologyRef | null;
}

// ── Metric payload ──
export interface MetricDef {
  slug: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  formula: string;
  isProxy: boolean;
}

export interface MetricSnapshot {
  asOf: string;
  value: number | null;
  freshnessStatus: "FRESH" | "STALE";
  stale: boolean;
  sourceTimestamps: Record<string, string>;
  payload: Record<string, unknown>;
}

export interface MetricPayload {
  metric: MetricDef;
  snapshot: MetricSnapshot;
  methodology: MethodologyRef | null;
  warnings: string[];
}

// ── Overview ──
export interface OverviewSummaryItem {
  value: number | null;
  unit: string;
  asOf: string;
}

export interface OverviewMetricItem {
  value: number | null;
  unit: string;
  asOf: string;
  stale: boolean;
}

export interface OverviewData {
  asOf: string | null;
  summary: {
    dollar: OverviewSummaryItem | null;
    debt: OverviewSummaryItem | null;
    inflation: OverviewSummaryItem | null;
    fedFunds: OverviewSummaryItem | null;
    m2: OverviewSummaryItem | null;
    fedAssets: OverviewSummaryItem | null;
    defenseObligations: OverviewSummaryItem | null;
    securityAid: OverviewSummaryItem | null;
  };
  metrics: {
    debtGrowthVelocity: OverviewMetricItem | null;
    dollarStrengthZScore: OverviewMetricItem | null;
    monetaryExpansionProxy: OverviewMetricItem | null;
    warSpendingProxy: OverviewMetricItem | null;
  };
  series: {
    dollar: SeriesPayload;
    debt: SeriesPayload;
    inflation: SeriesPayload;
  };
}

// ── Endpoint-specific ──
export interface DollarStrengthData {
  series: SeriesPayload;
  metric: MetricPayload;
}

export interface DebtData {
  totalDebt: SeriesPayload;
  debtHeldByPublic: SeriesPayload;
  intragovernmental: SeriesPayload;
  debtGrowthVelocity: MetricPayload;
}

export interface InflationData {
  cpi: SeriesPayload;
  coreCpi: SeriesPayload;
  breakeven5y: SeriesPayload;
}

export interface RatesData {
  fedFunds: SeriesPayload;
  treasury2y: SeriesPayload;
  treasury10y: SeriesPayload;
}

export interface MoneySupplyData {
  m2: SeriesPayload;
  fedAssets: SeriesPayload;
  reserveBalances: SeriesPayload;
}

export interface DefenseSpendingData {
  category: string;
  series: SeriesPayload[];
}

export interface ForeignAssistanceData {
  category: string;
  series: SeriesPayload[];
  breakdown: Array<{ observedAt: string; value: unknown }>;
}

// ── Methodology ──
export interface MethodologyNote {
  slug: string;
  title: string;
  summary: string;
  disclosure: string | null;
  limitations: string | null;
  contentMarkdown: string;
  version: number;
  effectiveAt: string;
  tags: string[];
}

// ── Source health ──
export interface SourceHealthRecord {
  source: { slug: string; name: string };
  score: number;
  freshnessStatus: "FRESH" | "STALE";
  freshnessLagSeconds: number | null;
  successRate24h: number | null;
  partialFailureRate24h: number | null;
  averageLatencyMs24h: number | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  latestObservedDataPointAt: string | null;
  lastErrorCode: string | null;
}
