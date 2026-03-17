const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const usdFull = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberCompact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

const pctFmt = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatValue(value: number | null | undefined, unit: string): string {
  if (value == null) return "—";

  switch (unit) {
    case "usd":
    case "billions_usd":
      return usdCompact.format(value);
    case "usd_annual_rate":
    case "millions_usd_annual_rate":
    case "billions_usd_annual_rate":
      return usdCompact.format(value) + "/yr";
    case "percent":
      return value.toFixed(2) + "%";
    case "basis_points":
      return value.toFixed(0) + " bps";
    case "index":
      return value.toFixed(2);
    case "score_0_100":
      return value.toFixed(1) + " / 100";
    case "zscore":
      return (value >= 0 ? "+" : "") + value.toFixed(2) + "σ";
    case "ratio":
      return value.toFixed(3);
    default:
      return numberCompact.format(value);
  }
}

export function formatUsdCompact(value: number | null | undefined): string {
  if (value == null) return "—";
  return usdCompact.format(value);
}

export function formatUsdFull(value: number | null | undefined): string {
  if (value == null) return "—";
  return usdFull.format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "—";
  return pctFmt.format(value / 100);
}

export function formatDelta(value: number | null | undefined): string {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  return sign + value.toFixed(2) + "%";
}

export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateShort(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(isoString);
}

export function formatLagSeconds(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export function chartValue(obs: { value: number | Record<string, unknown> | string | null }): number | null {
  if (typeof obs.value === "number") return obs.value;
  return null;
}
