import { formatRelativeTime } from "../lib/format";

interface FreshnessIndicatorProps {
  status: "FRESH" | "STALE" | "UNKNOWN";
  stale?: boolean;
  lastSync?: string | null;
}

export function FreshnessIndicator({
  status,
  stale,
  lastSync,
}: FreshnessIndicatorProps) {
  const isStale = stale || status === "STALE";
  const cls = isStale
    ? "badge-stale"
    : status === "FRESH"
      ? "badge-fresh"
      : "badge-unknown";
  const label = isStale ? "Stale" : status === "FRESH" ? "Live" : "Unknown";

  return (
    <div className="flex items-center gap-2">
      <span className={`badge ${cls}`}>
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            isStale
              ? "bg-data-warning animate-pulse-glow"
              : status === "FRESH"
                ? "bg-data-positive glow-dot"
                : "bg-data-neutral"
          }`}
        />
        {label}
      </span>
      {lastSync && (
        <span className="text-2xs text-text-muted">
          {formatRelativeTime(lastSync)}
        </span>
      )}
    </div>
  );
}
