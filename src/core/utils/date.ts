const RANGE_TO_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "180d": 180,
  "1y": 365,
  "2y": 365 * 2,
  "5y": 365 * 5,
  "10y": 365 * 10
};

export function parseRangeStart(range: string, now = new Date()): Date | null {
  if (range === "max") {
    return null;
  }

  const days = RANGE_TO_DAYS[range];

  if (!days) {
    return null;
  }

  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export function endOfFiscalYearDate(fiscalYear: number): Date {
  return new Date(Date.UTC(fiscalYear, 8, 30, 0, 0, 0));
}

export function toDateOnly(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }

  const normalized = value.includes("T") ? value : `${value}T00:00:00.000Z`;
  return new Date(normalized);
}

export function toMonthDate(year: number, monthNumber: number): Date {
  return new Date(Date.UTC(year, monthNumber - 1, 1, 0, 0, 0));
}

export function toQuarterDate(year: number, quarter: number): Date {
  return new Date(Date.UTC(year, (quarter - 1) * 3, 1, 0, 0, 0));
}

export function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function diffHours(older: Date, newer = new Date()): number {
  return Math.floor((newer.getTime() - older.getTime()) / (60 * 60 * 1000));
}

export function isExpired(
  reference: Date | null | undefined,
  staleAfterHours?: number | null,
  now = new Date()
): boolean {
  if (!reference || !staleAfterHours) {
    return false;
  }

  return diffHours(reference, now) > staleAfterHours;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
