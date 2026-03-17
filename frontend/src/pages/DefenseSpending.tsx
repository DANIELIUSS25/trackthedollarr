import { useState } from "react";
import { api } from "../lib/api";
import { useApi, useRange } from "../lib/hooks";
import type { DefenseSpendingData } from "../lib/types";
import { ErrorState } from "../components/ErrorState";
import { CardSkeleton } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { SeriesCard } from "../components/SeriesCard";
import { Warnings } from "../components/Warnings";

type Category = "overview" | "contracts" | "grants";

const categories: { value: Category; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "contracts", label: "Contracts" },
  { value: "grants", label: "Grants" },
];

const colors = ["#d45656", "#4a7fff", "#c5a44e"];

export function DefenseSpending() {
  const { range, setRange } = useRange("2y");
  const [category, setCategory] = useState<Category>("overview");
  const { data, warnings, loading, error, refetch } = useApi<DefenseSpendingData>(
    (q) => api.defenseSpending({ ...q, category }),
    { range },
    [range, category],
  );

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title="Defense Spending"
        subtitle="Department of Defense budgetary resources, obligations, and outlays from USAspending"
        range={range}
        onRangeChange={setRange}
      >
        <div className="flex gap-1 rounded-md border border-border-subtle bg-surface-3 p-0.5">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                category === c.value
                  ? "bg-surface-5 text-text-primary"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </PageHeader>
      <Warnings warnings={warnings} />
      {loading || !data ? (
        <CardSkeleton count={3} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
