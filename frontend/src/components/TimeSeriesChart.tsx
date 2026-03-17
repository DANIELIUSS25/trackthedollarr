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
  color = "#5b8def",
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
        className="flex items-center justify-center text-sm text-text-muted"
        style={{ height }}
      >
        No data available for this range
      </div>
    );
  }

  const gradientId = `grad-${color.replace("#", "")}-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="50%" stopColor={color} stopOpacity={0.08} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 6"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
        )}
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => formatDateShort(v)}
          tick={{ fill: "#4e5875", fontSize: 10, fontFamily: "Inter" }}
          axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
          tickLine={false}
          minTickGap={50}
          dy={8}
        />
        <YAxis
          tickFormatter={(v: number) => formatValue(v, unit)}
          tick={{ fill: "#4e5875", fontSize: 10, fontFamily: "Inter" }}
          axisLine={false}
          tickLine={false}
          width={65}
          dx={-4}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const item = payload[0]!;
            return (
              <div className="rounded-lg border border-border bg-surface-3/95 px-3.5 py-2.5 shadow-float backdrop-blur-md">
                <p className="text-2xs font-medium text-text-muted">
                  {formatDateShort(item.payload.date as string)}
                </p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-text-primary">
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
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          name={name}
          dot={false}
          activeDot={{
            r: 4,
            fill: color,
            stroke: "#080c15",
            strokeWidth: 2,
          }}
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
  const dateMap = new Map<string, Record<string, number | null>>();

  for (const s of series) {
    for (const obs of s.observations) {
      const existing = dateMap.get(obs.observedAt) ?? ({
        date: obs.observedAt,
      } as Record<string, unknown>);
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
        className="flex items-center justify-center text-sm text-text-muted"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient
              key={s.name}
              id={`grad-multi-${s.color.replace("#", "")}`}
              x1="0" y1="0" x2="0" y2="1"
            >
              <stop offset="0%" stopColor={s.color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => formatDateShort(v)}
          tick={{ fill: "#4e5875", fontSize: 10, fontFamily: "Inter" }}
          axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
          tickLine={false}
          minTickGap={50}
          dy={8}
        />
        <YAxis
          tickFormatter={(v: number) => formatValue(v, unit)}
          tick={{ fill: "#4e5875", fontSize: 10, fontFamily: "Inter" }}
          axisLine={false}
          tickLine={false}
          width={65}
          dx={-4}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-lg border border-border bg-surface-3/95 px-3.5 py-2.5 shadow-float backdrop-blur-md">
                <p className="mb-1.5 text-2xs font-medium text-text-muted">
                  {formatDateShort(payload[0]!.payload.date as string)}
                </p>
                {payload.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 py-0.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-2xs text-text-muted">{item.name}</span>
                    <span className="ml-auto font-mono text-xs font-semibold text-text-primary">
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
            strokeWidth={2}
            fill={`url(#grad-multi-${s.color.replace("#", "")})`}
            dot={false}
            activeDot={{ r: 4, fill: s.color, stroke: "#080c15", strokeWidth: 2 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
