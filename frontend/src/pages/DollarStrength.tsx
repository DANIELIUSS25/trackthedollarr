import { api } from "../lib/api";
import { useApi, useRange } from "../lib/hooks";
import type { DollarStrengthData } from "../lib/types";
import { ErrorState } from "../components/ErrorState";
import { CardSkeleton } from "../components/LoadingState";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { SeriesCard } from "../components/SeriesCard";
import { Warnings } from "../components/Warnings";

export function DollarStrength() {
  const { range, setRange } = useRange("1y");
  const { data, warnings, loading, error, refetch } = useApi<DollarStrengthData>(
    (q) => api.dollarStrength(q),
    { range },
    [range],
  );

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title="Dollar Strength"
        subtitle="U.S. Dollar Broad Index and strength z-score from official Federal Reserve data"
        range={range}
        onRangeChange={setRange}
      />
      <Warnings warnings={warnings} />
      {loading || !data ? (
        <CardSkeleton count={2} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SeriesCard payload={data.series} color="#4a7fff" chartHeight={340} />
          </div>
          <MetricCard metric={data.metric} />
        </div>
      )}
    </div>
  );
}
