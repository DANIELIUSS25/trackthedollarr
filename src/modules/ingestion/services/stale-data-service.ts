import { Frequency, FreshnessStatus, SourceStatus } from "@prisma/client";

import { prisma } from "../../../core/db/prisma";
import { diffHours, isExpired } from "../../../core/utils/date";
import { mean } from "../../../core/utils/math";
import { SourceSlug } from "../../../core/types";

type RefreshSummary = {
  refreshedAt: string;
  series: FreshnessCounts;
  datasets: FreshnessCounts;
  sources: FreshnessCounts;
  metrics: FreshnessCounts;
};

type FreshnessCounts = {
  fresh: number;
  stale: number;
  unknown: number;
};

type StaleAlertScope = "all" | "source" | "dataset" | "series" | "metric";

type StaleAlert = {
  scope: Exclude<StaleAlertScope, "all">;
  freshnessStatus: FreshnessStatus;
  identifier: string;
  name: string;
  sourceSlug?: string;
  datasetSlug?: string;
  lastUpdatedAt: Date | null;
  staleAfterHours: number | null;
  lagHours: number | null;
  warning: string;
};

export class StaleDataService {
  async refreshFreshness(sourceSlug?: SourceSlug, now = new Date()): Promise<RefreshSummary> {
    const seriesRecords = await prisma.series.findMany({
      where: sourceSlug
        ? {
            dataset: {
              dataSource: {
                slug: sourceSlug
              }
            }
          }
        : undefined,
      include: {
        dataset: {
          include: {
            dataSource: true
          }
        }
      }
    });

    const seriesStatuses = new Map<string, FreshnessStatus>();
    const datasetState = new Map<
      string,
      {
        freshnessStatuses: FreshnessStatus[];
        slug: string;
        name: string;
        sourceSlug: string;
        sourceId: string;
      }
    >();

    for (const series of seriesRecords) {
      const freshnessStatus = computeFreshnessStatus(series.lastObservationAt, series.staleAfterHours, now);
      seriesStatuses.set(series.slug, freshnessStatus);

      await prisma.series.update({
        where: { id: series.id },
        data: {
          freshnessStatus
        }
      });

      await prisma.observation.updateMany({
        where: {
          seriesId: series.id,
          isLatestRevision: true
        },
        data: {
          stale: false
        }
      });

      if (series.lastObservationAt && freshnessStatus === "STALE") {
        await prisma.observation.updateMany({
          where: {
            seriesId: series.id,
            isLatestRevision: true,
            observedAt: series.lastObservationAt
          },
          data: {
            stale: true
          }
        });
      }

      const datasetEntry = datasetState.get(series.datasetId) ?? {
        freshnessStatuses: [],
        slug: series.dataset.slug,
        name: series.dataset.name,
        sourceSlug: series.dataset.dataSource.slug,
        sourceId: series.dataset.dataSource.id
      };
      datasetEntry.freshnessStatuses.push(freshnessStatus);
      datasetState.set(series.datasetId, datasetEntry);
    }

    const datasetStatuses = new Map<string, FreshnessStatus>();
    const sourceState = new Map<
      string,
      {
        freshnessStatuses: FreshnessStatus[];
        slug: string;
        name: string;
        status: SourceStatus;
      }
    >();

    for (const [datasetId, entry] of datasetState.entries()) {
      const freshnessStatus = collapseFreshness(entry.freshnessStatuses);
      datasetStatuses.set(entry.slug, freshnessStatus);

      await prisma.dataset.update({
        where: { id: datasetId },
        data: {
          freshnessStatus
        }
      });

      const sourceEntry = sourceState.get(entry.sourceId) ?? {
        freshnessStatuses: [],
        slug: entry.sourceSlug,
        name: "",
        status: SourceStatus.ACTIVE
      };
      sourceEntry.freshnessStatuses.push(freshnessStatus);
      sourceState.set(entry.sourceId, sourceEntry);
    }

    const dataSources = await prisma.dataSource.findMany({
      where: sourceSlug
        ? {
            slug: sourceSlug
          }
        : undefined
    });

    for (const source of dataSources) {
      const freshnessStatus = collapseFreshness(sourceState.get(source.id)?.freshnessStatuses ?? []);
      await prisma.dataSource.update({
        where: { id: source.id },
        data: {
          status:
            source.status === SourceStatus.DISABLED
              ? SourceStatus.DISABLED
              : freshnessStatus === "FRESH"
                ? SourceStatus.ACTIVE
                : SourceStatus.DEGRADED,
          lastHealthyAt: freshnessStatus === "FRESH" ? now : source.lastHealthyAt
        }
      });
    }

    const latestSnapshots = await prisma.derivedMetricSnapshot.findMany({
      include: {
        definition: true
      },
      orderBy: [{ definitionId: "asc" }, { asOf: "desc" }],
      distinct: ["definitionId"]
    });

    const metricSeriesStatuses = new Map(
      (
        await prisma.series.findMany({
          select: {
            slug: true,
            freshnessStatus: true
          }
        })
      ).map((series) => [series.slug, series.freshnessStatus] as const)
    );
    const metricStatuses = new Map<string, FreshnessStatus>();
    const latestMetricMap = new Map(latestSnapshots.map((snapshot) => [snapshot.definition.slug, snapshot]));
    const orderedSnapshots = [...latestSnapshots].sort((left, right) =>
      dependencyWeight(left.definition.dependencies, latestMetricMap) -
      dependencyWeight(right.definition.dependencies, latestMetricMap)
    );

    for (const snapshot of orderedSnapshots) {
      const freshnessStatus = computeMetricFreshness(snapshot, metricSeriesStatuses, metricStatuses, now);
      metricStatuses.set(snapshot.definition.slug, freshnessStatus);

      const freshnessWarnings = buildMetricFreshnessWarnings(snapshot, metricSeriesStatuses, metricStatuses, now);
      await prisma.derivedMetricSnapshot.update({
        where: { id: snapshot.id },
        data: {
          stale: freshnessStatus === "STALE",
          freshnessStatus,
          warnings: dedupeWarnings([...snapshot.warnings, ...freshnessWarnings])
        }
      });
    }

    return {
      refreshedAt: now.toISOString(),
      series: countStatuses([...seriesStatuses.values()]),
      datasets: countStatuses([...datasetStatuses.values()]),
      sources: countStatuses(
        dataSources.map((source) =>
          collapseFreshness(sourceState.get(source.id)?.freshnessStatuses ?? [])
        )
      ),
      metrics: countStatuses([...metricStatuses.values()])
    };
  }

  async getStaleAlerts(params: {
    limit: number;
    scope?: StaleAlertScope;
    sourceSlug?: SourceSlug;
    now?: Date;
  }): Promise<{
    generatedAt: string;
    summary: {
      total: number;
      averageLagHours: number | null;
    };
    alerts: StaleAlert[];
  }> {
    const scope = params.scope ?? "all";
    const now = params.now ?? new Date();
    const alerts: StaleAlert[] = [];

    if (scope === "all" || scope === "series") {
      const series = await prisma.series.findMany({
        where: {
          freshnessStatus: {
            not: "FRESH"
          },
          ...(params.sourceSlug
            ? {
                dataset: {
                  dataSource: {
                    slug: params.sourceSlug
                  }
                }
              }
            : {})
        },
        include: {
          dataset: {
            include: {
              dataSource: true
            }
          }
        },
        orderBy: [{ freshnessStatus: "desc" }, { lastObservationAt: "asc" }],
        take: params.limit
      });

      alerts.push(
        ...series.map((entry) => ({
          scope: "series" as const,
          freshnessStatus: entry.freshnessStatus,
          identifier: entry.slug,
          name: entry.name,
          sourceSlug: entry.dataset.dataSource.slug,
          datasetSlug: entry.dataset.slug,
          lastUpdatedAt: entry.lastObservationAt,
          staleAfterHours: entry.staleAfterHours,
          lagHours: entry.lastObservationAt ? diffHours(entry.lastObservationAt, now) : null,
          warning: buildEntityWarning(entry.freshnessStatus, entry.lastObservationAt, entry.staleAfterHours)
        }))
      );
    }

    if (scope === "all" || scope === "dataset") {
      const datasets = await prisma.dataset.findMany({
        where: {
          freshnessStatus: {
            not: "FRESH"
          },
          ...(params.sourceSlug
            ? {
                dataSource: {
                  slug: params.sourceSlug
                }
              }
            : {})
        },
        include: {
          dataSource: true,
          series: {
            select: {
              lastObservationAt: true
            }
          }
        },
        orderBy: [{ freshnessStatus: "desc" }, { lastSuccessfulSyncAt: "asc" }],
        take: params.limit
      });

      alerts.push(
        ...datasets.map((entry) => {
          const lastUpdatedAt = latestDate(entry.series.map((series) => series.lastObservationAt));
          return {
            scope: "dataset" as const,
            freshnessStatus: entry.freshnessStatus,
            identifier: entry.slug,
            name: entry.name,
            sourceSlug: entry.dataSource.slug,
            lastUpdatedAt,
            staleAfterHours: entry.staleAfterHours,
            lagHours: lastUpdatedAt ? diffHours(lastUpdatedAt, now) : null,
            warning: buildEntityWarning(entry.freshnessStatus, lastUpdatedAt, entry.staleAfterHours)
          };
        })
      );
    }

    if (scope === "all" || scope === "source") {
      const sources = await prisma.dataSource.findMany({
        where: params.sourceSlug
          ? {
              slug: params.sourceSlug
            }
          : undefined,
        include: {
          datasets: {
            select: {
              freshnessStatus: true,
              lastSuccessfulSyncAt: true
            }
          }
        },
        orderBy: [{ updatedAt: "desc" }],
        take: params.limit
      });

      alerts.push(
        ...sources
          .map((entry) => {
            const freshnessStatus = collapseFreshness(entry.datasets.map((dataset) => dataset.freshnessStatus));
            if (freshnessStatus === "FRESH") {
              return null;
            }

            return {
              scope: "source" as const,
              freshnessStatus,
              identifier: entry.slug,
              name: entry.name,
              sourceSlug: entry.slug,
              lastUpdatedAt: latestDate(entry.datasets.map((dataset) => dataset.lastSuccessfulSyncAt)),
              staleAfterHours: entry.staleAfterHours,
              lagHours: entry.lastSuccessfulSyncAt ? diffHours(entry.lastSuccessfulSyncAt, now) : null,
              warning: buildEntityWarning(freshnessStatus, entry.lastSuccessfulSyncAt, entry.staleAfterHours)
            };
          })
          .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      );
    }

    if (scope === "all" || scope === "metric") {
      const snapshots = await prisma.derivedMetricSnapshot.findMany({
        where: {
          freshnessStatus: {
            not: "FRESH"
          }
        },
        include: {
          definition: true
        },
        orderBy: [{ updatedAt: "desc" }],
        take: params.limit
      });

      alerts.push(
        ...snapshots.map((entry) => ({
          scope: "metric" as const,
          freshnessStatus: entry.freshnessStatus,
          identifier: entry.definition.slug,
          name: entry.definition.name,
          lastUpdatedAt: entry.asOf,
          staleAfterHours: frequencyToStaleHours(entry.definition.frequency),
          lagHours: diffHours(entry.asOf, now),
          warning: buildEntityWarning(
            entry.freshnessStatus,
            entry.asOf,
            frequencyToStaleHours(entry.definition.frequency)
          )
        }))
      );
    }

    const sorted = alerts
      .sort((left, right) => {
        const leftRank = freshnessRank(left.freshnessStatus);
        const rightRank = freshnessRank(right.freshnessStatus);
        if (leftRank !== rightRank) {
          return rightRank - leftRank;
        }

        return (right.lagHours ?? -1) - (left.lagHours ?? -1);
      })
      .slice(0, params.limit);

    return {
      generatedAt: now.toISOString(),
      summary: {
        total: sorted.length,
        averageLagHours:
          sorted.length === 0
            ? null
            : Math.round(mean(sorted.map((alert) => alert.lagHours ?? 0)) * 100) / 100
      },
      alerts: sorted
    };
  }
}

function computeFreshnessStatus(
  reference: Date | null,
  staleAfterHours: number | null | undefined,
  now: Date
): FreshnessStatus {
  if (!reference) {
    return "UNKNOWN";
  }

  return isExpired(reference, staleAfterHours ?? null, now) ? "STALE" : "FRESH";
}

function collapseFreshness(statuses: FreshnessStatus[]): FreshnessStatus {
  if (statuses.length === 0) {
    return "UNKNOWN";
  }

  if (statuses.some((status) => status === "STALE")) {
    return "STALE";
  }

  if (statuses.some((status) => status === "FRESH")) {
    return "FRESH";
  }

  return "UNKNOWN";
}

function dependencyWeight(
  dependencies: unknown,
  latestMetricMap: ReadonlyMap<string, unknown>
): number {
  if (!Array.isArray(dependencies)) {
    return 0;
  }

  return dependencies.filter((dependency) => latestMetricMap.has(String(dependency))).length;
}

function computeMetricFreshness(
  snapshot: {
    asOf: Date;
    definition: {
      dependencies: unknown;
      frequency: Frequency;
    };
  },
  seriesStatuses: Map<string, FreshnessStatus>,
  metricStatuses: Map<string, FreshnessStatus>,
  now: Date
): FreshnessStatus {
  const warnings = buildMetricFreshnessWarnings(snapshot, seriesStatuses, metricStatuses, now);
  return warnings.length > 0 ? "STALE" : "FRESH";
}

function buildMetricFreshnessWarnings(
  snapshot: {
    asOf: Date;
    definition: {
      dependencies: unknown;
      frequency: Frequency;
    };
  },
  seriesStatuses: Map<string, FreshnessStatus>,
  metricStatuses: Map<string, FreshnessStatus>,
  now: Date
): string[] {
  const warnings: string[] = [];
  const dependencies = Array.isArray(snapshot.definition.dependencies)
    ? snapshot.definition.dependencies.map(String)
    : [];

  if (isExpired(snapshot.asOf, frequencyToStaleHours(snapshot.definition.frequency), now)) {
    warnings.push("Derived metric snapshot is older than its freshness window.");
  }

  for (const dependency of dependencies) {
    const seriesStatus = seriesStatuses.get(dependency);
    if (seriesStatus && seriesStatus !== "FRESH") {
      warnings.push(`Dependency series ${dependency} is ${seriesStatus.toLowerCase()}.`);
      continue;
    }

    const metricStatus = metricStatuses.get(dependency);
    if (metricStatus && metricStatus !== "FRESH") {
      warnings.push(`Dependency metric ${dependency} is ${metricStatus.toLowerCase()}.`);
      continue;
    }

    if (!seriesStatuses.has(dependency) && !metricStatuses.has(dependency)) {
      warnings.push(`Dependency freshness could not be resolved for ${dependency}.`);
    }
  }

  return dedupeWarnings(warnings);
}

function frequencyToStaleHours(frequency: Frequency): number {
  switch (frequency) {
    case "INTRADAY":
      return 12;
    case "DAILY":
      return 72;
    case "WEEKLY":
      return 240;
    case "MONTHLY":
      return 24 * 45;
    case "QUARTERLY":
      return 24 * 120;
    case "ANNUAL":
      return 24 * 400;
    case "IRREGULAR":
    default:
      return 24 * 14;
  }
}

function countStatuses(statuses: FreshnessStatus[]): FreshnessCounts {
  return {
    fresh: statuses.filter((status) => status === "FRESH").length,
    stale: statuses.filter((status) => status === "STALE").length,
    unknown: statuses.filter((status) => status === "UNKNOWN").length
  };
}

function latestDate(values: Array<Date | null | undefined>): Date | null {
  const filtered = values.filter((value): value is Date => Boolean(value));

  if (filtered.length === 0) {
    return null;
  }

  return [...filtered].sort((left, right) => right.getTime() - left.getTime())[0] ?? null;
}

function buildEntityWarning(
  freshnessStatus: FreshnessStatus,
  lastUpdatedAt: Date | null,
  staleAfterHours: number | null | undefined
): string {
  if (freshnessStatus === "UNKNOWN") {
    return "Freshness cannot be verified because no recent source observation is available.";
  }

  if (!lastUpdatedAt) {
    return "Freshness cannot be verified because the entity has no observation timestamp.";
  }

  if (!staleAfterHours) {
    return "Entity is outside its freshness threshold.";
  }

  return `Entity is older than the configured freshness threshold of ${staleAfterHours} hours.`;
}

function freshnessRank(status: FreshnessStatus): number {
  switch (status) {
    case "STALE":
      return 2;
    case "UNKNOWN":
      return 1;
    case "FRESH":
    default:
      return 0;
  }
}

function dedupeWarnings(warnings: string[]): string[] {
  return [...new Set(warnings)];
}
