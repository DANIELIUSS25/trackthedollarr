import { api } from "../lib/api";
import { useApi } from "../lib/hooks";
import type { MetricPayload } from "../lib/types";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { ProxyDisclosure } from "../components/ProxyDisclosure";
import { Warnings } from "../components/Warnings";
import { formatDate, formatValue } from "../lib/format";

export function WarSpendingProxy() {
  const { data, warnings, loading, error, refetch } = useApi<MetricPayload>(
    () => api.warSpendingProxy(),
    undefined,
    [],
  );

  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (loading || !data) return <LoadingState message="Loading proxy metric..." />;

  const { metric, snapshot, methodology } = data;

  return (
    <div>
      <PageHeader
        title="War Spending Proxy"
        subtitle="Derived composite score — not an official statistic"
      />

      {/* Prominent proxy disclosure */}
      <div className="mb-6">
        <ProxyDisclosure
          warnings={[
            ...warnings,
            ...data.warnings,
            "This is a derived proxy metric. It is not an official war-spending counter or government statistic.",
          ].filter((w, i, arr) => arr.indexOf(w) === i)}
          methodology={methodology}
        />
      </div>

      <Warnings warnings={warnings.filter((w) => !data.warnings.includes(w))} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="card mb-4">
            <div className="mb-4">
              <p className="text-sm font-medium text-text-secondary">{metric.name}</p>
              <div className="mt-2 flex items-end gap-3">
                <span className="metric-value-lg">
                  {formatValue(snapshot.value, metric.unit)}
                </span>
                <span className="badge badge-proxy">Proxy Metric</span>
              </div>
              <p className="mt-1 text-xs text-text-tertiary">
                As of {formatDate(snapshot.asOf)}
              </p>
            </div>

            <p className="text-sm text-text-secondary">{metric.description}</p>

            <div className="mt-4 rounded bg-surface-3 px-3 py-2">
              <p className="text-2xs font-semibold uppercase tracking-wider text-text-tertiary">
                Formula
              </p>
              <p className="mt-1 font-mono text-xs text-text-secondary">
                {metric.formula}
              </p>
            </div>
          </div>

          {methodology && (
            <div className="card">
              <h3 className="card-title mb-3">Methodology</h3>
              <p className="mb-2 text-sm text-text-secondary">{methodology.summary}</p>
              {methodology.limitations && (
                <div className="mt-3 rounded bg-data-warning/5 px-3 py-2 text-xs text-data-warning">
                  <span className="font-medium">Limitations: </span>
                  {methodology.limitations}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <MetricCard metric={data} />
        </div>
      </div>
    </div>
  );
}
