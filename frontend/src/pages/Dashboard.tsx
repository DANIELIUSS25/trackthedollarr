import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatDate, formatDelta, formatValue } from "../lib/format";
import { useApi, useRange } from "../lib/hooks";
import type { OverviewData, OverviewMetricItem, OverviewSummaryItem } from "../lib/types";
import { ErrorState } from "../components/ErrorState";
import { FreshnessIndicator } from "../components/FreshnessIndicator";
import { CardSkeleton } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { TimeSeriesChart } from "../components/TimeSeriesChart";
import { Warnings } from "../components/Warnings";

export function Dashboard() {
  const { range, setRange } = useRange("1y");
  const { data, warnings, loading, error, refetch } = useApi<OverviewData>(
    (q) => api.overview(q),
    { range },
    [range],
  );

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title="Macro Overview"
        subtitle={data?.asOf ? `As of ${formatDate(data.asOf)}` : undefined}
        range={range}
        onRangeChange={setRange}
      />

      <Warnings warnings={warnings} />

      {loading || !data ? (
        <CardSkeleton count={6} />
      ) : (
        <>
          {/* Summary cards */}
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Dollar Index" item={data.summary.dollar} unit="index" to="/dollar-strength" />
            <SummaryCard label="Total Debt" item={data.summary.debt} unit="usd" to="/debt" />
            <SummaryCard label="CPI (All Items)" item={data.summary.inflation} unit="index" to="/inflation" />
            <SummaryCard label="Fed Funds Rate" item={data.summary.fedFunds} unit="percent" to="/rates" />
            <SummaryCard label="M2 Money Stock" item={data.summary.m2} unit="billions_usd" to="/money-supply" />
            <SummaryCard label="Fed Total Assets" item={data.summary.fedAssets} unit="billions_usd" to="/money-supply" />
            <SummaryCard label="Defense Obligations" item={data.summary.defenseObligations} unit="usd" to="/defense-spending" />
            <SummaryCard label="Security Assistance" item={data.summary.securityAid} unit="usd" to="/foreign-assistance" />
          </div>

          {/* Derived metric panels */}
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DerivedMetricPanel label="Debt Growth Velocity" item={data.metrics.debtGrowthVelocity} to="/debt" />
            <DerivedMetricPanel label="Dollar Z-Score" item={data.metrics.dollarStrengthZScore} to="/dollar-strength" />
            <DerivedMetricPanel label="Monetary Expansion Proxy" item={data.metrics.monetaryExpansionProxy} to="/monetary-expansion-proxy" isProxy />
            <DerivedMetricPanel label="War Spending Proxy" item={data.metrics.warSpendingProxy} to="/war-spending-proxy" isProxy />
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Dollar Broad Index</h3>
                <FreshnessIndicator
                  status={data.series.dollar.freshness.freshnessStatus}
                  stale={data.series.dollar.freshness.stale}
                />
              </div>
              {data.series.dollar.analytics?.latest && (
                <div className="mb-4 flex items-end gap-3">
                  <span className="font-mono text-xl font-semibold tracking-tight text-text-primary">
                    {formatValue(data.series.dollar.analytics.latest.value, "index")}
                  </span>
                  {data.series.dollar.analytics.deltas["30d"] != null && (
                    <span className={`font-mono text-xs font-medium ${data.series.dollar.analytics.deltas["30d"]! > 0 ? "text-data-positive" : "text-data-negative"}`}>
                      {formatDelta(data.series.dollar.analytics.deltas["30d"])}
                      <span className="ml-1 text-text-muted">30d</span>
                    </span>
                  )}
                </div>
              )}
              <TimeSeriesChart observations={data.series.dollar.observations} unit="index" color="#00ff41" height={200} />
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Total Public Debt</h3>
                <FreshnessIndicator
                  status={data.series.debt.freshness.freshnessStatus}
                  stale={data.series.debt.freshness.stale}
                />
              </div>
              {data.series.debt.analytics?.latest && (
                <div className="mb-4 flex items-end gap-3">
                  <span className="font-mono text-xl font-semibold tracking-tight text-text-primary">
                    {formatValue(data.series.debt.analytics.latest.value, "usd")}
                  </span>
                  {data.series.debt.analytics.deltas["30d"] != null && (
                    <span className={`font-mono text-xs font-medium ${data.series.debt.analytics.deltas["30d"]! > 0 ? "text-data-negative" : "text-data-positive"}`}>
                      {formatDelta(data.series.debt.analytics.deltas["30d"])}
                      <span className="ml-1 text-text-muted">30d</span>
                    </span>
                  )}
                </div>
              )}
              <TimeSeriesChart observations={data.series.debt.observations} unit="usd" color="#ff3333" height={200} />
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">CPI (All Items)</h3>
                <FreshnessIndicator
                  status={data.series.inflation.freshness.freshnessStatus}
                  stale={data.series.inflation.freshness.stale}
                />
              </div>
              {data.series.inflation.analytics?.latest && (
                <div className="mb-4 flex items-end gap-3">
                  <span className="font-mono text-xl font-semibold tracking-tight text-text-primary">
                    {formatValue(data.series.inflation.analytics.latest.value, "index")}
                  </span>
                  {data.series.inflation.analytics.deltas["1y"] != null && (
                    <span className={`font-mono text-xs font-medium ${data.series.inflation.analytics.deltas["1y"]! > 0 ? "text-data-negative" : "text-data-positive"}`}>
                      {formatDelta(data.series.inflation.analytics.deltas["1y"])}
                      <span className="ml-1 text-text-muted">1y</span>
                    </span>
                  )}
                </div>
              )}
              <TimeSeriesChart observations={data.series.inflation.observations} unit="index" color="#ffb000" height={200} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  item,
  unit,
  to,
}: {
  label: string;
  item: OverviewSummaryItem | null;
  unit: string;
  to: string;
}) {
  return (
    <Link to={to} className="card card-interactive group">
      <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-text-muted group-hover:text-text-secondary transition-colors">
        {label}
      </p>
      <p className="font-mono text-lg font-semibold tracking-tight text-text-primary">
        {item ? formatValue(item.value, unit) : "—"}
      </p>
      {item?.asOf && (
        <p className="mt-1 text-2xs text-text-muted">{formatDate(item.asOf)}</p>
      )}
    </Link>
  );
}

function DerivedMetricPanel({
  label,
  item,
  to,
  isProxy = false,
}: {
  label: string;
  item: OverviewMetricItem | null;
  to: string;
  isProxy?: boolean;
}) {
  return (
    <Link to={to} className="card card-interactive group">
      <div className="mb-1.5 flex items-center gap-2">
        <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted group-hover:text-text-secondary transition-colors">
          {label}
        </p>
        {isProxy && <span className="badge badge-proxy text-2xs">Proxy</span>}
      </div>
      <p className="font-mono text-lg font-semibold tracking-tight text-text-primary">
        {item ? formatValue(item.value, item.unit) : "—"}
      </p>
      {item?.stale && (
        <p className="mt-1 text-2xs text-data-warning">Data may be stale</p>
      )}
      {item?.asOf && !item.stale && (
        <p className="mt-1 text-2xs text-text-muted">{formatDate(item.asOf)}</p>
      )}
    </Link>
  );
}
