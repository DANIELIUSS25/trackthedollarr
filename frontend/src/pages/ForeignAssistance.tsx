import { useState } from "react";
import { api } from "../lib/api";
import { useApi, useRange } from "../lib/hooks";
import type { ForeignAssistanceData } from "../lib/types";
import { ErrorState } from "../components/ErrorState";
import { CardSkeleton } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { SeriesCard } from "../components/SeriesCard";
import { Warnings } from "../components/Warnings";

type Category = "total" | "security";

const colors = ["#00ff41", "#aa66ff", "#ffb000"];

export function ForeignAssistance() {
  const { range, setRange } = useRange("5y");
  const [category, setCategory] = useState<Category>("total");
  const { data, warnings, loading, error, refetch } = useApi<ForeignAssistanceData>(
    (q) => api.foreignAssistance({ ...q, category }),
    { range },
    [range, category],
  );

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title="Foreign Assistance"
        subtitle="U.S. foreign assistance obligations and disbursements from USAID open data"
        range={range}
        onRangeChange={setRange}
      >
        <div className="flex gap-1 rounded-lg border border-border-subtle bg-surface-2/50 backdrop-blur-sm p-0.5">
          {(["total", "security"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
                category === c
                  ? "bg-accent-gold-dim text-accent-gold shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </PageHeader>
      <Warnings warnings={warnings} />
      {loading || !data ? (
        <CardSkeleton count={2} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.series.map((s, i) => (
            <SeriesCard
              key={s.series.slug}
              payload={s}
              color={colors[i % colors.length]!}
            />
          ))}
        </div>
      )}
    </div>
  );
}
