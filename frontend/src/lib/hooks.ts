import { useCallback, useEffect, useState } from "react";
import type { ApiEnvelope, ApiRange, SeriesQuery } from "./types";

type FetchFn<T> = (query?: SeriesQuery) => Promise<ApiEnvelope<T>>;

interface UseApiResult<T> {
  data: T | null;
  warnings: string[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(
  fetchFn: FetchFn<T>,
  query?: SeriesQuery,
  deps: unknown[] = [],
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchFn(query)
      .then((envelope) => {
        if (!cancelled) {
          setData(envelope.data);
          setWarnings(envelope.warnings ?? []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "An error occurred");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, query?.range, query?.frequency, query?.compare, ...deps]);

  return { data, warnings, loading, error, refetch };
}

export function useRange(defaultRange: ApiRange = "1y") {
  const [range, setRange] = useState<ApiRange>(defaultRange);
  return { range, setRange };
}
