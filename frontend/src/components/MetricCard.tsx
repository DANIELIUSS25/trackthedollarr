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
        <div className="flex items-center gap-2">
          <h3 className="card-title">{def.name}</h3>
          {def.isProxy && <span className="badge badge-proxy">Proxy</span>}
        </div>
        <FreshnessIndicator
          status={snapshot.freshnessStatus}
          stale={snapshot.stale}
        />
      </div>

      <div className="mb-3">
        <span className="metric-value">
          {formatValue(snapshot.value, def.unit)}
        </span>
        <span className="ml-2 text-xs text-text-tertiary">
          as of {formatDate(snapshot.asOf)}
        </span>
      </div>

      <p className="mb-3 text-sm text-text-secondary">{def.description}</p>

      {def.isProxy && (
        <ProxyDisclosure
          warnings={warnings}
          methodology={methodology}
          compact
        />
      )}

      {/* Component breakdown if available */}
      {snapshot.payload?.components != null && (
        <div className="mt-3 border-t border-border-subtle pt-3">
          <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-text-tertiary">
            Components
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(
              snapshot.payload.components as Record<string, number>,
            ).map(([key, val]) => (
              <div key={key} className="rounded bg-surface-3 px-2 py-1.5">
                <p className="text-2xs text-text-tertiary">{formatComponentLabel(key)}</p>
                <p className="font-mono text-sm text-text-primary">
                  {typeof val === "number" ? val.toFixed(2) : String(val)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source timestamps */}
      {Object.keys(snapshot.sourceTimestamps).length > 0 && (
        <div className="mt-3 border-t border-border-subtle pt-3">
          <p className="mb-1 text-2xs font-semibold uppercase tracking-wider text-text-tertiary">
            Source Data Points
          </p>
          <div className="space-y-0.5">
            {Object.entries(snapshot.sourceTimestamps).map(([key, ts]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-text-tertiary">{formatComponentLabel(key)}</span>
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
