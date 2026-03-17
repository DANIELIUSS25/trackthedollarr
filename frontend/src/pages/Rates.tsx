import { api } from "../lib/api";
import { useApi, useRange } from "../lib/hooks";
import type { RatesData } from "../lib/types";
import { ErrorState } from "../components/ErrorState";
import { CardSkeleton } from "../components/LoadingState";
import { MultiSeriesChart } from "../components/TimeSeriesChart";
import { PageHeader } from "../components/PageHeader";
import { SeriesCard } from "../components/SeriesCard";
import { Warnings } from "../components/Warnings";
import { FreshnessIndicator } from "../components/FreshnessIndicator";

export function Rates() {
  const { range, setRange } = useRange("2y");
  const { data, warnings, loading, error, refetch } = useApi<RatesData>(
    (q) => api.rates(q),
    { range },
    [range],
  );

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title="Interest Rates"
        subtitle="Fed Funds rate and Treasury yields from official Federal Reserve data"
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
              <h3 className="card-title">Rate Curve</h3>
              <FreshnessIndicator
                status={data.fedFunds.freshness.freshnessStatus}
                stale={data.fedFunds.freshness.stale}
              />
            </div>
            <MultiSeriesChart
              series={[
                { observations: data.fedFunds.observations, color: "#ffb000", name: "Fed Funds" },
                { observations: data.treasury2y.observations, color: "#00ff41", name: "2Y Treasury" },
                { observations: data.treasury10y.observations, color: "#ff3333", name: "10Y Treasury" },
              ]}
              unit="percent"
              height={340}
            />
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-accent-gold" /> Fed Funds</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-accent-blue" /> 2Y Treasury</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-data-negative" /> 10Y Treasury</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <SeriesCard payload={data.fedFunds} color="#ffb000" compact />
            <SeriesCard payload={data.treasury2y} color="#00ff41" compact />
            <SeriesCard payload={data.treasury10y} color="#ff3333" compact />
          </div>
        </>
      )}
    </div>
  );
}
