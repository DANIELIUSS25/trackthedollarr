import { api } from "../lib/api";
import { useApi, useRange } from "../lib/hooks";
import type { MoneySupplyData } from "../lib/types";
import { ErrorState } from "../components/ErrorState";
import { CardSkeleton } from "../components/LoadingState";
import { MultiSeriesChart } from "../components/TimeSeriesChart";
import { PageHeader } from "../components/PageHeader";
import { SeriesCard } from "../components/SeriesCard";
import { Warnings } from "../components/Warnings";
import { FreshnessIndicator } from "../components/FreshnessIndicator";

export function MoneySupply() {
  const { range, setRange } = useRange("2y");
  const { data, warnings, loading, error, refetch } = useApi<MoneySupplyData>(
    (q) => api.moneySupply(q),
    { range },
    [range],
  );

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title="Money Supply"
        subtitle="M2, Federal Reserve balance sheet, and reserve balances"
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
              <h3 className="card-title">Monetary Aggregates</h3>
              <FreshnessIndicator
                status={data.m2.freshness.freshnessStatus}
                stale={data.m2.freshness.stale}
              />
            </div>
            <MultiSeriesChart
              series={[
                { observations: data.m2.observations, color: "#00ff41", name: "M2" },
                { observations: data.fedAssets.observations, color: "#ffb000", name: "Fed Assets" },
                { observations: data.reserveBalances.observations, color: "#aa66ff", name: "Reserves" },
              ]}
              unit={data.m2.series.unit}
              height={340}
            />
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-accent-blue" /> M2</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-accent-gold" /> Fed Assets</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-accent-purple" /> Reserves</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <SeriesCard payload={data.m2} color="#00ff41" compact />
            <SeriesCard payload={data.fedAssets} color="#ffb000" compact />
            <SeriesCard payload={data.reserveBalances} color="#aa66ff" compact />
          </div>
        </>
      )}
    </div>
  );
}
