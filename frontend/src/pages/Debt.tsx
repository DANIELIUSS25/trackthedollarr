import { api } from "../lib/api";
import { useApi, useRange } from "../lib/hooks";
import type { DebtData } from "../lib/types";
import { ErrorState } from "../components/ErrorState";
import { CardSkeleton } from "../components/LoadingState";
import { MetricCard } from "../components/MetricCard";
import { MultiSeriesChart } from "../components/TimeSeriesChart";
import { PageHeader } from "../components/PageHeader";
import { SeriesCard } from "../components/SeriesCard";
import { Warnings } from "../components/Warnings";
import { FreshnessIndicator } from "../components/FreshnessIndicator";

export function Debt() {
  const { range, setRange } = useRange("2y");
  const { data, warnings, loading, error, refetch } = useApi<DebtData>(
    (q) => api.debt(q),
    { range },
    [range],
  );

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title="National Debt"
        subtitle="U.S. Treasury fiscal data — total debt, public holdings, and intragovernmental"
        range={range}
        onRangeChange={setRange}
      />
      <Warnings warnings={warnings} />
      {loading || !data ? (
        <CardSkeleton count={4} />
      ) : (
        <>
          {/* Composite chart */}
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title">Debt Composition</h3>
              <FreshnessIndicator
                status={data.totalDebt.freshness.freshnessStatus}
                stale={data.totalDebt.freshness.stale}
              />
            </div>
            <MultiSeriesChart
              series={[
                {
                  observations: data.totalDebt.observations,
                  color: "#d45656",
                  name: "Total Debt",
                },
                {
                  observations: data.debtHeldByPublic.observations,
                  color: "#4a7fff",
                  name: "Public Holdings",
                },
                {
                  observations: data.intragovernmental.observations,
                  color: "#8b5cf6",
                  name: "Intragovernmental",
                },
              ]}
              unit="usd"
              height={340}
            />
            <div className="mt-3 flex gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-data-negative" /> Total Debt</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent-blue" /> Public Holdings</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent-purple" /> Intragovernmental</span>
            </div>
          </div>

          {/* Individual series + velocity metric */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SeriesCard payload={data.totalDebt} color="#d45656" compact />
            <SeriesCard payload={data.debtHeldByPublic} color="#4a7fff" compact />
            <MetricCard metric={data.debtGrowthVelocity} />
          </div>
        </>
      )}
    </div>
  );
}
