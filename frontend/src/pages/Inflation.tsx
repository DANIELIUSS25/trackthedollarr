import { api } from "../lib/api";
import { useApi, useRange } from "../lib/hooks";
import type { InflationData } from "../lib/types";
import { ErrorState } from "../components/ErrorState";
import { CardSkeleton } from "../components/LoadingState";
import { MultiSeriesChart } from "../components/TimeSeriesChart";
import { PageHeader } from "../components/PageHeader";
import { SeriesCard } from "../components/SeriesCard";
import { Warnings } from "../components/Warnings";
import { FreshnessIndicator } from "../components/FreshnessIndicator";

export function Inflation() {
  const { range, setRange } = useRange("2y");
  const { data, warnings, loading, error, refetch } = useApi<InflationData>(
    (q) => api.inflation(q),
    { range },
    [range],
  );

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title="Inflation"
        subtitle="Consumer Price Index and inflation expectations from BLS and FRED"
        range={range}
        onRangeChange={setRange}
      />
      <Warnings warnings={warnings} />
      {loading || !data ? (
        <CardSkeleton count={3} />
      ) : (
        <>
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title">Inflation Measures</h3>
              <FreshnessIndicator
                status={data.cpi.freshness.freshnessStatus}
                stale={data.cpi.freshness.stale}
              />
            </div>
            <MultiSeriesChart
              series={[
                { observations: data.cpi.observations, color: "#d4944e", name: "CPI All Items" },
                { observations: data.coreCpi.observations, color: "#5b8def", name: "Core CPI" },
                { observations: data.breakeven5y.observations, color: "#a78bfa", name: "5Y Breakeven" },
              ]}
              unit={data.cpi.series.unit}
              height={340}
            />
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-data-warning" /> CPI All Items</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-accent-blue" /> Core CPI</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-accent-purple" /> 5Y Breakeven</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <SeriesCard payload={data.cpi} color="#d4944e" compact />
            <SeriesCard payload={data.coreCpi} color="#5b8def" compact />
            <SeriesCard payload={data.breakeven5y} color="#a78bfa" compact />
          </div>
        </>
      )}
    </div>
  );
}
