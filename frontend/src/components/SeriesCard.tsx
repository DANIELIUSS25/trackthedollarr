import type { SeriesPayload } from "../lib/types";
import { formatDate, formatDelta, formatValue } from "../lib/format";
import { FreshnessIndicator } from "./FreshnessIndicator";
import { TimeSeriesChart } from "./TimeSeriesChart";

interface SeriesCardProps {
  payload: SeriesPayload;
  color?: string;
  chartHeight?: number;
  showChart?: boolean;
  compact?: boolean;
  className?: string;
}

export function SeriesCard({
  payload,
  color = "#5b8def",
  chartHeight = 200,
  showChart = true,
  compact = false,
  className = "",
}: SeriesCardProps) {
  const { series, observations, analytics, freshness, methodology, comparison } = payload;
  const latest = analytics?.latest;

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <div>
          <h3 className="card-title">{series.name}</h3>
          {!compact && (
            <p className="mt-1 text-2xs text-text-muted">
              {series.source} · {series.frequency}
            </p>
          )}
        </div>
        <FreshnessIndicator
          status={freshness.freshnessStatus}
          stale={freshness.stale}
        />
      </div>

      {/* Current value & deltas */}
      <div className="mb-4 flex items-end gap-4">
        <div>
          <span className={compact ? "font-mono text-xl font-semibold tracking-tight text-text-primary" : "metric-value"}>
            {formatValue(latest?.value ?? null, series.unit)}
          </span>
          {latest && (
            <span className="ml-2 text-2xs text-text-muted">
              {formatDate(latest.observedAt)}
            </span>
          )}
        </div>

        {analytics?.deltas && (
          <div className="flex gap-3">
            {(["7d", "30d", "1y"] as const).map((period) => {
              const delta = analytics.deltas[period];
              if (delta == null) return null;
              return (
                <div key={period} className="text-right">
                  <p className="text-2xs text-text-muted">{period}</p>
                  <p
                    className={`font-mono text-xs font-semibold ${
                      delta > 0
                        ? "text-data-positive"
                        : delta < 0
                          ? "text-data-negative"
                          : "text-text-secondary"
                    }`}
                  >
                    {formatDelta(delta)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparison */}
      {comparison && (
        <div className="mb-4 rounded-lg bg-surface-3/50 px-3 py-2.5 text-xs">
          <span className="text-text-muted">vs {comparison.mode}: </span>
          <span
            className={`font-mono font-semibold ${
              comparison.percentChange > 0
                ? "text-data-positive"
                : comparison.percentChange < 0
                  ? "text-data-negative"
                  : "text-text-secondary"
            }`}
          >
            {formatDelta(comparison.percentChange)}
          </span>
          <span className="text-text-muted">
            {" "}(from {formatDate(comparison.baseObservedAt)})
          </span>
        </div>
      )}

      {/* Chart */}
      {showChart && observations.length > 0 && (
        <div className="-mx-1">
          <TimeSeriesChart
            observations={observations}
            unit={series.unit}
            color={color}
            height={chartHeight}
            name={series.name}
          />
        </div>
      )}

      {/* Observation warnings */}
      {observations.some((o) => o.warnings.length > 0) && (
        <div className="mt-3 space-y-1">
          {observations
            .flatMap((o) => o.warnings)
            .filter((w, i, arr) => arr.indexOf(w) === i)
            .map((w) => (
              <p key={w} className="text-xs text-data-warning">
                {w}
              </p>
            ))}
        </div>
      )}

      {/* Methodology note */}
      {methodology && !compact && (
        <div className="mt-4 border-t border-border-subtle pt-4">
          <p className="text-xs leading-relaxed text-text-muted">
            <span className="font-medium text-text-secondary">
              {methodology.title}:
            </span>{" "}
            {methodology.summary}
          </p>
          {methodology.limitations && (
            <p className="mt-1.5 text-xs text-data-warning">
              {methodology.limitations}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
