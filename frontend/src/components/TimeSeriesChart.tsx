import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Observation } from "../lib/types";
import { chartValue, formatDateShort, formatValue } from "../lib/format";

interface TimeSeriesChartProps {
  observations: Observation[];
  unit: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  name?: string;
}

export function TimeSeriesChart({
  observations,
  unit,
  color = "#4a7fff",
  height = 280,
  showGrid = true,
  name,
}: TimeSeriesChartProps) {
  const data = observations
    .map((obs) => ({
      date: obs.observedAt,
      value: chartValue(obs),
    }))
    .filter((d) => d.value !== null);

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-sm text-text-tertiary"
        style={{ height }}
      >
        No data available for this range
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1e2540"
            vertical={false}
          />
        )}
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => formatDateShort(v)}
          tick={{ fill: "#5a6380", fontSize: 11 }}
          axisLine={{ stroke: "#1e2540" }}
          tickLine={false}
          minTickGap={40}
        />
        <YAxis
          tickFormatter={(v: number) => formatValue(v, unit)}
          tick={{ fill: "#5a6380", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const item = payload[0]!;
            return (
              <div className="rounded-md border border-border bg-surface-3 px-3 py-2 shadow-lg">
                <p className="text-xs text-text-secondary">
                  {formatDateShort(item.payload.date as string)}
                </p>
                <p className="font-mono text-sm font-semibold text-text-primary">
                  {formatValue(item.value as number, unit)}
                </p>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#grad-${color.replace("#", "")})`}
          name={name}
          dot={false}
          activeDot={{ r: 3, fill: color, stroke: "#0a0e17", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface MultiSeriesChartProps {
  series: Array<{
    observations: Observation[];
    color: string;
    name: string;
  }>;
  unit: string;
  height?: number;
}

export function MultiSeriesChart({
  series,
  unit,
  height = 280,
}: MultiSeriesChartProps) {
  // Merge all series into a single dataset keyed by date
  const dateMap = new Map<string, Record<string, number | null>>();

  for (const s of series) {
    for (const obs of s.observations) {
      const existing = dateMap.get(obs.observedAt) ?? { date: obs.observedAt } as Record<string, unknown>;
      (existing as Record<string, unknown>)[s.name] = chartValue(obs);
      dateMap.set(obs.observedAt, existing as Record<string, number | null>);
    }
  }

  const data = [...dateMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-sm text-text-tertiary"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient
              key={s.name}
              id={`grad-multi-${s.color.replace("#", "")}`}
              x1="0" y1="0" x2="0" y2="1"
            >
              <stop offset="0%" stopColor={s.color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2540" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => formatDateShort(v)}
          tick={{ fill: "#5a6380", fontSize: 11 }}
          axisLine={{ stroke: "#1e2540" }}
          tickLine={false}
          minTickGap={40}
        />
        <YAxis
          tickFormatter={(v: number) => formatValue(v, unit)}
          tick={{ fill: "#5a6380", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-md border border-border bg-surface-3 px-3 py-2 shadow-lg">
                <p className="mb-1 text-xs text-text-secondary">
                  {formatDateShort(payload[0]!.payload.date as string)}
                </p>
                {payload.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-text-secondary">{item.name}:</span>
                    <span className="font-mono text-xs font-semibold text-text-primary">
                      {formatValue(item.value as number, unit)}
                    </span>
                  </div>
                ))}
              </div>
            );
          }}
        />
        {series.map((s) => (
          <Area
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={s.color}
            strokeWidth={1.5}
            fill={`url(#grad-multi-${s.color.replace("#", "")})`}
            dot={false}
            activeDot={{ r: 3, fill: s.color, stroke: "#0a0e17", strokeWidth: 2 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
