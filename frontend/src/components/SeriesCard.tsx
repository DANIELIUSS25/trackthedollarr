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
  color = "#4a7fff",
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
            <p className="mt-0.5 text-xs text-text-tertiary">
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
      <div className="mb-3 flex items-end gap-4">
        <div>
          <span className={compact ? "font-mono text-xl font-semibold text-text-primary" : "metric-value"}>
            {formatValue(latest?.value ?? null, series.unit)}
          </span>
          {latest && (
            <span className="ml-2 text-xs text-text-tertiary">
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
                  <p className="text-2xs text-text-tertiary">{period}</p>
                  <p
                    className={`font-mono text-xs font-medium ${
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
        <div className="mb-3 rounded bg-surface-3 px-3 py-2 text-xs">
          <span className="text-text-tertiary">vs {comparison.mode}: </span>
          <span
            className={`font-mono font-medium ${
              comparison.percentChange > 0
                ? "text-data-positive"
                : comparison.percentChange < 0
                  ? "text-data-negative"
                  : "text-text-secondary"
            }`}
          >
            {formatDelta(comparison.percentChange)}
          </span>
          <span className="text-text-tertiary">
            {" "}
            (from {formatDate(comparison.baseObservedAt)})
          </span>
        </div>
      )}

      {/* Chart */}
      {showChart && observations.length > 0 && (
        <TimeSeriesChart
          observations={observations}
          unit={series.unit}
          color={color}
          height={chartHeight}
          name={series.name}
        />
      )}

      {/* Observation warnings */}
      {observations.some((o) => o.warnings.length > 0) && (
        <div className="mt-2">
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
        <div className="mt-3 border-t border-border-subtle pt-3">
          <p className="text-xs text-text-tertiary">
            <span className="font-medium text-text-secondary">
              {methodology.title}:
            </span>{" "}
            {methodology.summary}
          </p>
          {methodology.limitations && (
            <p className="mt-1 text-xs text-data-warning">
              {methodology.limitations}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
