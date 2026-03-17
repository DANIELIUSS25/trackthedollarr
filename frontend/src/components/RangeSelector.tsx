import type { ApiRange } from "../lib/types";

const ranges: { value: ApiRange; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "1M" },
  { value: "90d", label: "3M" },
  { value: "180d", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "2y", label: "2Y" },
  { value: "5y", label: "5Y" },
  { value: "10y", label: "10Y" },
  { value: "max", label: "Max" },
];

interface RangeSelectorProps {
  value: ApiRange;
  onChange: (range: ApiRange) => void;
  compact?: boolean;
}

export function RangeSelector({ value, onChange, compact }: RangeSelectorProps) {
  const items = compact ? ranges.filter((r) => ["30d", "90d", "1y", "5y", "max"].includes(r.value)) : ranges;

  return (
    <div className="flex gap-1">
      {items.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
            value === r.value
              ? "bg-accent-gold/15 text-accent-gold"
              : "text-text-tertiary hover:bg-surface-4 hover:text-text-secondary"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
