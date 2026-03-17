export function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function stdDev(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }

  const average = mean(values);
  const variance = mean(values.map((value) => (value - average) ** 2));
  return Math.sqrt(variance);
}

export function percentile(values: number[], target: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.filter((value) => value <= target).length;
  return (count / sorted.length) * 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function round(value: number, precision = 4): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function annualizedChange(current: number, previous: number, periodsPerYear: number): number {
  if (!previous || previous <= 0 || periodsPerYear <= 0) {
    return 0;
  }

  return ((current / previous) ** periodsPerYear - 1) * 100;
}

export function safeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();

    if (!normalized || normalized === "." || normalized.toLowerCase() === "nan") {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}
