import { Observation, Prisma } from "@prisma/client";

import { NotFoundError } from "../../../core/errors/app-error";
import { isExpired, parseRangeStart } from "../../../core/utils/date";
import { DerivedMetricService } from "../../metrics/services/derived-metric-service";
import { prisma } from "../../../core/db/prisma";

type SeriesQueryParams = {
  range: string;
  frequency: string;
  limit: number;
  compare?: string;
};

export class PlatformReadService {
  private readonly derivedMetricService = new DerivedMetricService();

  async getOverview(params: SeriesQueryParams) {
    const latestSeries = await this.getLatestSeriesValues([
      "dollar-broad-index",
      "total-public-debt-outstanding",
      "cpi-all-items",
      "effective-fed-funds-rate",
      "m2-money-stock",
      "fed-total-assets",
      "dod-total-obligations",
      "security-assistance-obligations"
    ]);
    const metricSnapshots = await this.getLatestMetricValues([
      "debt-growth-velocity",
      "dollar-strength-zscore",
      "monetary-expansion-proxy",
      "war-spending-proxy"
    ]);

    return {
      asOf: maxDate([
        latestSeries["dollar-broad-index"]?.asOf,
        latestSeries["total-public-debt-outstanding"]?.asOf,
        latestSeries["cpi-all-items"]?.asOf,
        metricSnapshots["monetary-expansion-proxy"]?.asOf,
        metricSnapshots["war-spending-proxy"]?.asOf
      ]),
      summary: {
        dollar: latestSeries["dollar-broad-index"],
        debt: latestSeries["total-public-debt-outstanding"],
        inflation: latestSeries["cpi-all-items"],
        fedFunds: latestSeries["effective-fed-funds-rate"],
        m2: latestSeries["m2-money-stock"],
        fedAssets: latestSeries["fed-total-assets"],
        defenseObligations: latestSeries["dod-total-obligations"],
        securityAid: latestSeries["security-assistance-obligations"]
      },
      metrics: {
        debtGrowthVelocity: metricSnapshots["debt-growth-velocity"],
        dollarStrengthZScore: metricSnapshots["dollar-strength-zscore"],
        monetaryExpansionProxy: metricSnapshots["monetary-expansion-proxy"],
        warSpendingProxy: metricSnapshots["war-spending-proxy"]
      },
      series: {
        dollar: await this.getSeriesPayload("dollar-broad-index", params),
        debt: await this.getSeriesPayload("total-public-debt-outstanding", params),
        inflation: await this.getSeriesPayload("cpi-all-items", params)
      }
    };
  }

  async getSeriesPayload(seriesSlug: string, params: SeriesQueryParams) {
    const rangeStart = parseRangeStart(params.range);
    const series = await prisma.series.findUnique({
      where: { slug: seriesSlug },
      include: {
        methodologyNote: true,
        dataset: {
          include: {
            dataSource: true,
            methodologyNote: true
          }
        },
        observations: {
          where: {
            isLatestRevision: true,
            ...(rangeStart
              ? {
                  observedAt: {
                    gte: rangeStart
                  }
                }
              : {})
          },
          orderBy: {
            observedAt: "desc"
          },
          take: params.limit
        }
      }
    });

    if (!series) {
      throw new NotFoundError(`Series ${seriesSlug} was not found`, { seriesSlug });
    }

    const reversed = [...series.observations].reverse();
    const observations = series.valueType === "NUMERIC" ? resampleObservations(reversed, params.frequency) : reversed;
    const analytics = series.valueType === "NUMERIC" ? await this.derivedMetricService.buildSeriesAnalytics(seriesSlug) : null;
    const comparison =
      series.valueType === "NUMERIC" && params.compare
        ? computeComparison(observations, params.compare)
        : null;
    const stale = series.freshnessStatus === "STALE" || isExpired(series.lastObservationAt, series.staleAfterHours);

    return {
      series: {
        slug: series.slug,
        sourceCode: series.sourceCode,
        name: series.name,
        description: series.description,
        unit: series.unit,
        frequency: series.frequency,
        category: series.category,
        source: series.dataset.dataSource.name,
        sourceSlug: series.dataset.dataSource.slug,
        sourcePageUrl: series.sourcePageUrl
      },
      observations: observations.map((observation) => serializeObservation(observation)),
      analytics,
      comparison,
      freshness: {
        freshnessStatus: series.freshnessStatus,
        stale,
        lastObservationAt: series.lastObservationAt,
        lastSuccessfulSyncAt: series.lastSuccessfulSyncAt
      },
      methodology: pickMethodology(series.methodologyNote ?? series.dataset.methodologyNote)
    };
  }

  async getMetricPayload(metricSlug: string) {
    const snapshot = await this.derivedMetricService.getLatestMetricSnapshot(metricSlug);

    if (!snapshot) {
      throw new NotFoundError(`Metric ${metricSlug} was not found`, { metricSlug });
    }

    return {
      metric: {
        slug: snapshot.definition.slug,
        name: snapshot.definition.name,
        description: snapshot.definition.description,
        category: snapshot.definition.category,
        unit: snapshot.definition.unit,
        formula: snapshot.definition.formula,
        isProxy: snapshot.definition.isProxy
      },
      snapshot: {
        asOf: snapshot.asOf,
        value: snapshot.value === null ? null : Number(snapshot.value),
        freshnessStatus: snapshot.freshnessStatus,
        stale: snapshot.stale,
        sourceTimestamps: snapshot.sourceTimestamps,
        payload: snapshot.payload
      },
      methodology: pickMethodology(snapshot.definition.methodologyNote),
      warnings: snapshot.warnings
    };
  }

  async getMethodology(slug?: string) {
    const notes = await prisma.methodologyNote.findMany({
      where: slug
        ? {
            slug
          }
        : undefined,
      orderBy: {
        title: "asc"
      }
    });

    return notes.map((note) => ({
      slug: note.slug,
      title: note.title,
      summary: note.summary,
      disclosure: note.disclosure,
      limitations: note.limitations,
      contentMarkdown: note.contentMarkdown,
      version: note.version,
      effectiveAt: note.effectiveAt,
      tags: note.tags
    }));
  }

  async getSourceHealth(sourceSlug?: string) {
    const healthRecords = await prisma.sourceHealth.findMany({
      where: sourceSlug
        ? {
            dataSource: {
              slug: sourceSlug
            }
          }
        : undefined,
      include: {
        dataSource: true
      },
      orderBy: [
        {
          score: "asc"
        },
        {
          updatedAt: "desc"
        }
      ]
    });

    return healthRecords.map((record) => ({
      source: {
        slug: record.dataSource.slug,
        name: record.dataSource.name
      },
      score: record.score,
      freshnessStatus: record.freshnessStatus,
      freshnessLagSeconds: record.freshnessLagSeconds,
      successRate24h: record.successRate24h === null ? null : Number(record.successRate24h),
      partialFailureRate24h:
        record.partialFailureRate24h === null ? null : Number(record.partialFailureRate24h),
      averageLatencyMs24h: record.averageLatencyMs24h,
      lastSuccessAt: record.lastSuccessAt,
      lastFailureAt: record.lastFailureAt,
      latestObservedDataPointAt: record.latestObservedDataPointAt,
      lastErrorCode: record.lastErrorCode
    }));
  }

  async getDefenseSpending(params: SeriesQueryParams & { category: "overview" | "contracts" | "grants" }) {
    const seriesSlugs =
      params.category === "contracts"
        ? ["dod-contract-obligations", "dod-award-obligations", "dod-total-obligations"]
        : params.category === "grants"
          ? ["dod-grant-obligations", "dod-award-obligations", "dod-total-obligations"]
          : ["dod-total-obligations", "dod-total-outlays", "dod-award-obligations"];

    const series = await Promise.all(seriesSlugs.map((slug) => this.getSeriesPayload(slug, params)));

    return {
      category: params.category,
      series
    };
  }

  async getForeignAssistance(params: SeriesQueryParams & { country?: string; category: "total" | "security" }) {
    const numericSeriesSlug =
      params.category === "security"
        ? ["security-assistance-obligations", "security-assistance-disbursements"]
        : ["foreign-assistance-total-obligations", "foreign-assistance-total-disbursements"];
    const breakdownSlug =
      params.category === "security"
        ? "security-assistance-sector-summary"
        : "foreign-assistance-country-summary";

    const series = await Promise.all(numericSeriesSlug.map((slug) => this.getSeriesPayload(slug, params)));
    const breakdown = await this.getSeriesPayload(breakdownSlug, {
      range: params.range,
      frequency: "annual",
      limit: params.limit
    });

    const filteredBreakdown = params.country
      ? breakdown.observations
          .map((observation) => {
            const payload = (observation.value ?? {}) as Record<string, unknown>;
            const countries = Array.isArray(payload.countries) ? payload.countries : [];

            return {
              observedAt: observation.observedAt,
              value: countries.filter((entry) =>
                String((entry as Record<string, unknown>).country ?? "")
                  .toLowerCase()
                  .includes(params.country!.toLowerCase())
              )
            };
          })
          .filter((entry) => (entry.value as unknown[]).length > 0)
      : breakdown.observations;

    return {
      category: params.category,
      series,
      breakdown: filteredBreakdown
    };
  }

  private async getLatestSeriesValues(seriesSlugs: string[]) {
    const series = await prisma.series.findMany({
      where: {
        slug: {
          in: seriesSlugs
        }
      },
      include: {
        observations: {
          where: {
            isLatestRevision: true,
            numericValue: {
              not: null
            }
          },
          orderBy: {
            observedAt: "desc"
          },
          take: 1
        }
      }
    });

    return Object.fromEntries(
      series.map((entry) => {
        const latest = entry.observations[0];
        return [
          entry.slug,
          latest
            ? {
                value: latest.numericValue === null ? null : Number(latest.numericValue),
                unit: entry.unit,
                asOf: latest.observedAt
              }
            : null
        ];
      })
    ) as Record<string, { value: number | null; unit: string; asOf: Date } | null>;
  }

  private async getLatestMetricValues(metricSlugs: string[]) {
    const snapshots = await prisma.derivedMetricSnapshot.findMany({
      where: {
        definition: {
          slug: {
            in: metricSlugs
          }
        }
      },
      include: {
        definition: true
      },
      orderBy: {
        asOf: "desc"
      }
    });

    const latestBySlug = new Map<string, (typeof snapshots)[number]>();

    for (const snapshot of snapshots) {
      if (!latestBySlug.has(snapshot.definition.slug)) {
        latestBySlug.set(snapshot.definition.slug, snapshot);
      }
    }

    return Object.fromEntries(
      [...latestBySlug.entries()].map(([slug, snapshot]) => [
        slug,
        {
          value: snapshot.value === null ? null : Number(snapshot.value),
          unit: snapshot.definition.unit,
          asOf: snapshot.asOf,
          stale: snapshot.stale
        }
      ])
    ) as Record<string, { value: number | null; unit: string; asOf: Date; stale: boolean }>;
  }
}

function resampleObservations(observations: Observation[], frequency: string): Observation[] {
  if (frequency === "auto") {
    return observations;
  }

  const buckets = new Map<string, Observation>();

  for (const observation of observations) {
    const key = bucketKey(observation.observedAt, frequency);
    buckets.set(key, observation);
  }

  return [...buckets.values()].sort((a, b) => a.observedAt.getTime() - b.observedAt.getTime());
}

function bucketKey(date: Date, frequency: string): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;

  switch (frequency) {
    case "daily":
      return date.toISOString().slice(0, 10);
    case "weekly": {
      const weekStart = new Date(Date.UTC(year, date.getUTCMonth(), date.getUTCDate() - date.getUTCDay()));
      return weekStart.toISOString().slice(0, 10);
    }
    case "monthly":
      return `${year}-${String(month).padStart(2, "0")}`;
    case "quarterly":
      return `${year}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
    case "annual":
      return `${year}`;
    default:
      return date.toISOString().slice(0, 10);
  }
}

function serializeObservation(observation: Observation) {
  return {
    observedAt: observation.observedAt,
    value:
      observation.numericValue !== null
        ? Number(observation.numericValue)
        : observation.jsonValue ?? observation.textValue,
    valueStatus: observation.valueStatus,
    sourceUpdatedAt: observation.sourceUpdatedAt,
    warnings: observation.warnings
  };
}

function pickMethodology(note: { slug: string; title: string; summary: string; limitations: string | null } | null) {
  if (!note) {
    return null;
  }

  return {
    slug: note.slug,
    title: note.title,
    summary: note.summary,
    limitations: note.limitations
  };
}

function maxDate(values: Array<Date | null | undefined>): Date | null {
  const dates = values.filter((value): value is Date => Boolean(value));
  return dates.length ? dates.sort((a, b) => b.getTime() - a.getTime())[0] ?? null : null;
}

function computeComparison(observations: Observation[], mode: string) {
  const latest = observations[observations.length - 1];

  if (!latest || latest.numericValue === null) {
    return null;
  }

  let base: Observation | undefined;

  if (mode === "previous") {
    base = observations.at(-2);
  } else {
    const days = mode === "1y" ? 365 : mode === "5y" ? 365 * 5 : null;

    if (!days) {
      return null;
    }

    const targetTimestamp = latest.observedAt.getTime() - days * 24 * 60 * 60 * 1000;
    base = [...observations]
      .reverse()
      .find((observation) => observation.observedAt.getTime() <= targetTimestamp && observation.numericValue !== null);
  }

  if (!base || base.numericValue === null || Number(base.numericValue) === 0) {
    return null;
  }

  const latestValue = Number(latest.numericValue);
  const baseValue = Number(base.numericValue);

  return {
    mode,
    baseObservedAt: base.observedAt,
    absoluteChange: latestValue - baseValue,
    percentChange: ((latestValue - baseValue) / baseValue) * 100
  };
}
