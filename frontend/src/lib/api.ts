import type {
  ApiEnvelope,
  DebtData,
  DefenseSpendingData,
  DollarStrengthData,
  ForeignAssistanceData,
  InflationData,
  MetricPayload,
  MethodologyNote,
  MoneySupplyData,
  OverviewData,
  RatesData,
  SeriesPayload,
  SeriesQuery,
  SourceHealthRecord,
} from "./types";

const BASE = "/api/v1";

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== "",
  );
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

async function fetchJson<T>(path: string): Promise<ApiEnvelope<T>> {
  const res = await fetch(path);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      (body as { error?: { code?: string } }).error?.code ?? "UNKNOWN",
      (body as { error?: { message?: string } }).error?.message ?? res.statusText,
    );
  }
  return res.json() as Promise<ApiEnvelope<T>>;
}

function seriesParams(q?: SeriesQuery): Record<string, string | number | undefined> {
  return {
    range: q?.range,
    frequency: q?.frequency,
    compare: q?.compare,
    limit: q?.limit,
  };
}

export const api = {
  overview: (q?: SeriesQuery) =>
    fetchJson<OverviewData>(`${BASE}/overview${qs(seriesParams(q))}`),

  dollarStrength: (q?: SeriesQuery) =>
    fetchJson<DollarStrengthData>(`${BASE}/dollar-strength${qs(seriesParams(q))}`),

  debt: (q?: SeriesQuery) =>
    fetchJson<DebtData>(`${BASE}/debt${qs(seriesParams(q))}`),

  inflation: (q?: SeriesQuery) =>
    fetchJson<InflationData>(`${BASE}/inflation${qs(seriesParams(q))}`),

  rates: (q?: SeriesQuery) =>
    fetchJson<RatesData>(`${BASE}/rates${qs(seriesParams(q))}`),

  moneySupply: (q?: SeriesQuery) =>
    fetchJson<MoneySupplyData>(`${BASE}/money-supply${qs(seriesParams(q))}`),

  moneyPrintingProxy: () =>
    fetchJson<MetricPayload>(`${BASE}/money-printing-proxy`),

  warSpendingProxy: () =>
    fetchJson<MetricPayload>(`${BASE}/war-spending-proxy`),

  defenseSpending: (
    q?: SeriesQuery & { agency?: string; category?: string },
  ) =>
    fetchJson<DefenseSpendingData>(
      `${BASE}/defense-spending${qs({ ...seriesParams(q), agency: q?.agency, category: q?.category })}`,
    ),

  foreignAssistance: (
    q?: SeriesQuery & { country?: string; category?: string },
  ) =>
    fetchJson<ForeignAssistanceData>(
      `${BASE}/foreign-assistance${qs({ ...seriesParams(q), country: q?.country, category: q?.category })}`,
    ),

  series: (slug: string, q?: SeriesQuery) =>
    fetchJson<SeriesPayload>(`${BASE}/series/${encodeURIComponent(slug)}${qs(seriesParams(q))}`),

  methodology: (slug?: string) =>
    fetchJson<MethodologyNote[]>(`${BASE}/methodology${qs({ slug })}`),

  sourceHealth: (source?: string) =>
    fetchJson<SourceHealthRecord[]>(`${BASE}/source-health${qs({ source })}`),
};

export { ApiError };
