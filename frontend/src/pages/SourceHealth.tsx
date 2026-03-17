import { api } from "../lib/api";
import { useApi } from "../lib/hooks";
import type { SourceHealthRecord } from "../lib/types";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { FreshnessIndicator } from "../components/FreshnessIndicator";
import { PageHeader } from "../components/PageHeader";
import { formatDate, formatLagSeconds, formatRelativeTime } from "../lib/format";

export function SourceHealth() {
  const { data, loading, error, refetch } = useApi<SourceHealthRecord[]>(
    () => api.sourceHealth(),
    undefined,
    [],
  );

  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (loading || !data) return <LoadingState message="Loading source health..." />;

  return (
    <div>
      <PageHeader
        title="Source Health"
        subtitle="Data source reliability, sync status, and freshness monitoring"
      />

      {data.length === 0 ? (
        <div className="text-center text-sm text-text-tertiary py-12">
          No source health data available yet.
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((record) => (
            <div key={`${record.source.slug}`} className="card">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HealthScore score={record.score} />
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      {record.source.name}
                    </h3>
                    <p className="text-xs text-text-tertiary">
                      {record.source.slug}
                    </p>
                  </div>
                </div>
                <FreshnessIndicator
                  status={record.freshnessStatus}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCell
                  label="Health Score"
                  value={`${record.score}/100`}
                  color={record.score >= 80 ? "positive" : record.score >= 50 ? "warning" : "negative"}
                />
                <StatCell
                  label="Freshness Lag"
                  value={formatLagSeconds(record.freshnessLagSeconds)}
                />
                <StatCell
                  label="Success Rate (24h)"
                  value={
                    record.successRate24h != null
                      ? `${record.successRate24h.toFixed(1)}%`
                      : "—"
                  }
                  color={
                    record.successRate24h != null
                      ? record.successRate24h >= 95
                        ? "positive"
                        : record.successRate24h >= 70
                          ? "warning"
                          : "negative"
                      : undefined
                  }
                />
                <StatCell
                  label="Avg Latency (24h)"
                  value={
                    record.averageLatencyMs24h != null
                      ? `${record.averageLatencyMs24h}ms`
                      : "—"
                  }
                />
              </div>

              <div className="mt-3 grid gap-2 border-t border-border-subtle pt-3 text-xs sm:grid-cols-3">
                <div>
                  <span className="text-text-tertiary">Last Success: </span>
                  <span className="text-text-secondary">
                    {record.lastSuccessAt ? formatRelativeTime(record.lastSuccessAt) : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-text-tertiary">Last Failure: </span>
                  <span className="text-text-secondary">
                    {record.lastFailureAt ? formatRelativeTime(record.lastFailureAt) : "None"}
                  </span>
                </div>
                <div>
                  <span className="text-text-tertiary">Latest Data: </span>
                  <span className="text-text-secondary">
                    {record.latestObservedDataPointAt
                      ? formatDate(record.latestObservedDataPointAt)
                      : "—"}
                  </span>
                </div>
              </div>

              {record.lastErrorCode && (
                <div className="mt-2 rounded bg-data-negative/5 px-3 py-1.5 text-xs text-data-negative">
                  Last error: {record.lastErrorCode}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HealthScore({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-data-positive" : score >= 50 ? "text-data-warning" : "text-data-negative";
  const bg =
    score >= 80 ? "bg-data-positive/10" : score >= 50 ? "bg-data-warning/10" : "bg-data-negative/10";

  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
      <span className={`font-mono text-sm font-bold ${color}`}>{score}</span>
    </div>
  );
}

function StatCell({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: "positive" | "warning" | "negative";
}) {
  const colorClass = color
    ? color === "positive"
      ? "text-data-positive"
      : color === "warning"
        ? "text-data-warning"
        : "text-data-negative"
    : "text-text-primary";

  return (
    <div className="rounded bg-surface-3 px-3 py-2">
      <p className="text-2xs text-text-tertiary">{label}</p>
      <p className={`font-mono text-sm font-semibold ${colorClass}`}>{value}</p>
    </div>
  );
}
