import type { MetricPayload } from "../lib/types";
import { formatDate, formatValue } from "../lib/format";
import { FreshnessIndicator } from "./FreshnessIndicator";
import { ProxyDisclosure } from "./ProxyDisclosure";

interface MetricCardProps {
  metric: MetricPayload;
  className?: string;
}

export function MetricCard({ metric, className = "" }: MetricCardProps) {
  const { metric: def, snapshot, methodology, warnings } = metric;

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <div className="flex items-center gap-2.5">
          <h3 className="card-title">{def.name}</h3>
          {def.isProxy && <span className="badge badge-proxy">Proxy</span>}
        </div>
        <FreshnessIndicator
          status={snapshot.freshnessStatus}
          stale={snapshot.stale}
        />
      </div>

      <div className="mb-4">
        <span className="metric-value">
          {formatValue(snapshot.value, def.unit)}
        </span>
        <span className="ml-2 text-2xs text-text-muted">
          as of {formatDate(snapshot.asOf)}
        </span>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-text-secondary">{def.description}</p>

      {def.isProxy && (
        <ProxyDisclosure
          warnings={warnings}
          methodology={methodology}
          compact
        />
      )}

      {/* Component breakdown */}
      {snapshot.payload?.components != null && (
        <div className="mt-4 border-t border-border-subtle pt-4">
          <p className="mb-2.5 section-label">Components</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(
              snapshot.payload.components as Record<string, number>,
            ).map(([key, val]) => (
              <div key={key} className="stat-cell">
                <p className="text-2xs text-text-muted">{formatComponentLabel(key)}</p>
                <p className="font-mono text-sm font-medium text-text-primary">
                  {typeof val === "number" ? val.toFixed(2) : String(val)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source timestamps */}
      {Object.keys(snapshot.sourceTimestamps).length > 0 && (
        <div className="mt-4 border-t border-border-subtle pt-4">
          <p className="mb-2 section-label">Source Data Points</p>
          <div className="space-y-1">
            {Object.entries(snapshot.sourceTimestamps).map(([key, ts]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-text-muted">{formatComponentLabel(key)}</span>
                <span className="font-mono text-text-secondary">
                  {formatDate(ts)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatComponentLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}
