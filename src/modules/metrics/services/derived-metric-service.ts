import { FreshnessStatus, Prisma } from "@prisma/client";

import { prisma } from "../../../core/db/prisma";
import { clamp, mean, percentile, round, stdDev } from "../../../core/utils/math";

type NumericPoint = {
  observedAt: Date;
  value: number;
};

type SeriesHistoryContext = {
  slug: string;
  freshnessStatus: FreshnessStatus;
  lastObservationAt: Date | null;
  points: NumericPoint[];
};

type SeriesAnalytics = {
  latest: NumericPoint | null;
  deltas: Record<string, number | null>;
  rollingAverage: number | null;
  annualizedChange: number | null;
  percentile: number | null;
  zScore: number | null;
};

type ComputedMetricSnapshot = {
  asOf: Date;
  value: number | null;
  stale: boolean;
  payload: Record<string, unknown>;
  sourceTimestamps: Record<string, unknown>;
  warnings: string[];
};

export class DerivedMetricService {
  async computeAndPersistSnapshots(): Promise<Array<{ slug: string; asOf: Date; value: number | null }>> {
    const definitions = await prisma.derivedMetricDefinition.findMany({
      where: {
        isActive: true
      },
      include: {
        methodologyNote: true
      }
    });
    const snapshots: Array<{ slug: string; asOf: Date; value: number | null }> = [];

    for (const definition of definitions) {
      const computed = await this.computeDefinition(definition.slug);

      if (!computed) {
        continue;
      }

      await prisma.derivedMetricSnapshot.upsert({
        where: {
          definitionId_asOf: {
            definitionId: definition.id,
            asOf: computed.asOf
          }
        },
        update: {
          value: computed.value,
          payload: computed.payload as Prisma.InputJsonValue,
          freshnessStatus: computed.stale ? "STALE" : "FRESH",
          stale: computed.stale,
          methodologyVersion: definition.methodologyNote?.version ?? 1,
          sourceTimestamps: computed.sourceTimestamps as Prisma.InputJsonValue,
          warnings: computed.warnings
        },
        create: {
          definitionId: definition.id,
          asOf: computed.asOf,
          value: computed.value,
          payload: computed.payload as Prisma.InputJsonValue,
          freshnessStatus: computed.stale ? "STALE" : "FRESH",
          stale: computed.stale,
          methodologyVersion: definition.methodologyNote?.version ?? 1,
          sourceTimestamps: computed.sourceTimestamps as Prisma.InputJsonValue,
          warnings: computed.warnings
        }
      });

      snapshots.push({
        slug: definition.slug,
        asOf: computed.asOf,
        value: computed.value
      });
    }

    return snapshots;
  }

  async getLatestMetricSnapshot(slug: string) {
    return prisma.derivedMetricSnapshot.findFirst({
      where: {
        definition: {
          slug
        }
      },
      include: {
        definition: {
          include: {
            methodologyNote: true
          }
        }
      },
      orderBy: {
        asOf: "desc"
      }
    });
  }

  async buildSeriesAnalytics(seriesSlug: string): Promise<SeriesAnalytics> {
    const { points } = await this.getSeriesHistory(seriesSlug, 400);

    if (points.length === 0) {
      return emptyAnalytics();
    }

    const latest = lastPoint(points);

    if (!latest) {
      return emptyAnalytics();
    }

    const deltas = {
      "7d": computeChangeFromDays(points, 7),
      "30d": computeChangeFromDays(points, 30),
      "90d": computeChangeFromDays(points, 90),
      "1y": computeChangeFromDays(points, 365)
    };
    const trailing = points.slice(-90).map((point) => point.value);
    const annualizedBase = nearestPointBefore(
      points,
      new Date(latest.observedAt.getTime() - 365 * 24 * 60 * 60 * 1000)
    );
    const annualizedChange =
      annualizedBase && annualizedBase.value !== 0
        ? round(((latest.value - annualizedBase.value) / annualizedBase.value) * 100, 4)
        : null;

    return {
      latest,
      deltas,
      rollingAverage: trailing.length ? round(mean(trailing), 4) : null,
      annualizedChange,
      percentile: round(percentile(points.map((point) => point.value), latest.value), 4),
      zScore: (() => {
        const values = points.map((point) => point.value);
        const sigma = stdDev(values);
        return sigma === 0 ? null : round((latest.value - mean(values)) / sigma, 4);
      })()
    };
  }

  private async computeDefinition(slug: string): Promise<ComputedMetricSnapshot | null> {
    switch (slug) {
      case "debt-growth-velocity":
        return this.computeDebtGrowthVelocity();
      case "dollar-strength-zscore":
        return this.computeDollarStrengthZScore();
      case "monetary-expansion-proxy":
        return this.computeMonetaryExpansionProxy();
      case "war-spending-proxy":
        return this.computeWarSpendingProxy();
      default:
        return null;
    }
  }

  private async computeDebtGrowthVelocity(): Promise<ComputedMetricSnapshot | null> {
    const context = await this.getSeriesHistory("total-public-debt-outstanding", 120);

    if (context.points.length < 61) {
      return null;
    }

    const latest = lastPoint(context.points);

    if (!latest) {
      return null;
    }

    const p30 = nearestPointBefore(
      context.points,
      new Date(latest.observedAt.getTime() - 30 * 24 * 60 * 60 * 1000)
    );
    const p60 = nearestPointBefore(
      context.points,
      new Date(latest.observedAt.getTime() - 60 * 24 * 60 * 60 * 1000)
    );

    if (!p30 || !p60 || p30.value === 0 || p60.value === 0) {
      return null;
    }

    const currentGrowth = ((latest.value - p30.value) / p30.value) * 100;
    const priorGrowth = ((p30.value - p60.value) / p60.value) * 100;
    const velocity = round(currentGrowth - priorGrowth, 4);

    return {
      asOf: latest.observedAt,
      value: velocity,
      stale: context.freshnessStatus !== "FRESH",
      payload: {
        current30dGrowth: round(currentGrowth, 4),
        prior30dGrowth: round(priorGrowth, 4)
      },
      sourceTimestamps: {
        totalPublicDebtOutstanding: latest.observedAt.toISOString()
      },
      warnings: freshnessWarningsForSeries([context])
    };
  }

  private async computeDollarStrengthZScore(): Promise<ComputedMetricSnapshot | null> {
    const context = await this.getSeriesHistory("dollar-broad-index", 260);

    if (context.points.length < 40) {
      return null;
    }

    const latest = lastPoint(context.points);

    if (!latest) {
      return null;
    }

    const values = context.points.map((point) => point.value);
    const sigma = stdDev(values);

    if (sigma === 0) {
      return null;
    }

    const zScore = round((latest.value - mean(values)) / sigma, 4);

    return {
      asOf: latest.observedAt,
      value: zScore,
      stale: context.freshnessStatus !== "FRESH",
      payload: {
        mean: round(mean(values), 4),
        stdDev: round(sigma, 4)
      },
      sourceTimestamps: {
        dollarBroadIndex: latest.observedAt.toISOString()
      },
      warnings: freshnessWarningsForSeries([context])
    };
  }

  private async computeMonetaryExpansionProxy(): Promise<ComputedMetricSnapshot | null> {
    const [fedAssets, reserves, m2, debtVelocity] = await Promise.all([
      this.getSeriesHistory("fed-total-assets", 260),
      this.getSeriesHistory("reserve-balances", 260),
      this.getSeriesHistory("m2-money-stock", 180),
      this.computeDebtGrowthVelocity()
    ]);

    if (fedAssets.points.length < 26 || reserves.points.length < 26 || m2.points.length < 24 || !debtVelocity?.value) {
      return null;
    }

    const fedAssetsZ = computeRollingChangeZScore(fedAssets.points, 13);
    const reservesZ = computeRollingChangeZScore(reserves.points, 13);
    const m2Z = computeRollingChangeZScore(m2.points, 12);
    const debtVelocityNormalized = clamp(debtVelocity.value / 10, -3, 3);
    const compositeZ = fedAssetsZ * 0.35 + reservesZ * 0.3 + m2Z * 0.2 + debtVelocityNormalized * 0.15;
    const score = round(clamp(((compositeZ + 3) / 6) * 100, 0, 100), 2);
    const fedAssetsLatest = lastPoint(fedAssets.points);
    const reservesLatest = lastPoint(reserves.points);
    const m2Latest = lastPoint(m2.points);

    if (!fedAssetsLatest || !reservesLatest || !m2Latest) {
      return null;
    }

    const asOf =
      [fedAssetsLatest.observedAt, reservesLatest.observedAt, m2Latest.observedAt].sort(
        (a, b) => a.getTime() - b.getTime()
      )[0] ?? fedAssetsLatest.observedAt;
    const freshnessWarnings = [
      ...freshnessWarningsForSeries([fedAssets, reserves, m2]),
      ...debtVelocity.warnings.filter((warning) => warning.toLowerCase().includes("stale"))
    ];

    return {
      asOf,
      value: score,
      stale:
        fedAssets.freshnessStatus !== "FRESH" ||
        reserves.freshnessStatus !== "FRESH" ||
        m2.freshnessStatus !== "FRESH" ||
        debtVelocity.stale,
      payload: {
        components: {
          fedAssetsZ: round(fedAssetsZ, 4),
          reservesZ: round(reservesZ, 4),
          m2Z: round(m2Z, 4),
          debtVelocityNormalized: round(debtVelocityNormalized, 4)
        },
        compositeZ: round(compositeZ, 4)
      },
      sourceTimestamps: {
        fedTotalAssets: fedAssetsLatest.observedAt.toISOString(),
        reserveBalances: reservesLatest.observedAt.toISOString(),
        m2MoneyStock: m2Latest.observedAt.toISOString(),
        debtGrowthVelocity: debtVelocity.asOf.toISOString()
      },
      warnings: dedupeWarnings([
        "Proxy metric. Not an official money-printing counter.",
        ...freshnessWarnings
      ])
    };
  }

  private async computeWarSpendingProxy(): Promise<ComputedMetricSnapshot | null> {
    const [obligations, contractObligations, awardObligations, securityAid] = await Promise.all([
      this.getSeriesHistory("dod-total-obligations", 15),
      this.getSeriesHistory("dod-contract-obligations", 15),
      this.getSeriesHistory("dod-award-obligations", 15),
      this.getSeriesHistory("security-assistance-obligations", 15)
    ]);

    if (
      obligations.points.length < 4 ||
      contractObligations.points.length < 4 ||
      awardObligations.points.length < 4 ||
      securityAid.points.length < 4
    ) {
      return null;
    }

    const obligationsZ = computeRollingChangeZScore(obligations.points, 1);
    const securityAidZ = computeRollingChangeZScore(securityAid.points, 1);
    const latestContract = lastPoint(contractObligations.points);
    const latestAward = lastPoint(awardObligations.points);

    if (!latestContract || !latestAward) {
      return null;
    }

    const contractShare = latestAward.value > 0 ? latestContract.value / latestAward.value : 0;
    const contractShareHistory = contractObligations.points.slice(1).map((point, index) => {
      const awardPoint = awardObligations.points[index + 1];
      return awardPoint && awardPoint.value > 0 ? point.value / awardPoint.value : 0;
    });
    const contractShareZ = computeStandaloneZScore(contractShareHistory, contractShare);
    const compositeZ = obligationsZ * 0.45 + contractShareZ * 0.2 + securityAidZ * 0.35;
    const score = round(clamp(((compositeZ + 3) / 6) * 100, 0, 100), 2);
    const obligationsLatest = lastPoint(obligations.points);
    const contractLatest = lastPoint(contractObligations.points);
    const securityLatest = lastPoint(securityAid.points);

    if (!obligationsLatest || !contractLatest || !securityLatest) {
      return null;
    }

    const asOf =
      [obligationsLatest.observedAt, contractLatest.observedAt, securityLatest.observedAt].sort(
        (a, b) => a.getTime() - b.getTime()
      )[0] ?? obligationsLatest.observedAt;

    return {
      asOf,
      value: score,
      stale:
        obligations.freshnessStatus !== "FRESH" ||
        contractObligations.freshnessStatus !== "FRESH" ||
        awardObligations.freshnessStatus !== "FRESH" ||
        securityAid.freshnessStatus !== "FRESH",
      payload: {
        components: {
          obligationsZ: round(obligationsZ, 4),
          contractShareZ: round(contractShareZ, 4),
          securityAidZ: round(securityAidZ, 4)
        },
        contractShare: round(contractShare, 4),
        compositeZ: round(compositeZ, 4)
      },
      sourceTimestamps: {
        dodTotalObligations: obligationsLatest.observedAt.toISOString(),
        dodContractObligations: contractLatest.observedAt.toISOString(),
        securityAid: securityLatest.observedAt.toISOString()
      },
      warnings: dedupeWarnings([
        "Proxy metric. Not an official war-spending counter.",
        ...freshnessWarningsForSeries([obligations, contractObligations, awardObligations, securityAid])
      ])
    };
  }

  private async getSeriesHistory(seriesSlug: string, take: number): Promise<SeriesHistoryContext> {
    const series = await prisma.series.findUnique({
      where: { slug: seriesSlug },
      select: {
        slug: true,
        freshnessStatus: true,
        lastObservationAt: true,
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
          take,
          select: {
            observedAt: true,
            numericValue: true
          }
        }
      }
    });

    return {
      slug: seriesSlug,
      freshnessStatus: series?.freshnessStatus ?? "UNKNOWN",
      lastObservationAt: series?.lastObservationAt ?? null,
      points: [...(series?.observations ?? [])]
        .reverse()
        .map((observation) => ({
          observedAt: observation.observedAt,
          value: Number(observation.numericValue)
        }))
    };
  }
}

function emptyAnalytics(): SeriesAnalytics {
  return {
    latest: null,
    deltas: {
      "7d": null,
      "30d": null,
      "90d": null,
      "1y": null
    },
    rollingAverage: null,
    annualizedChange: null,
    percentile: null,
    zScore: null
  };
}

function freshnessWarningsForSeries(contexts: SeriesHistoryContext[]): string[] {
  return dedupeWarnings(
    contexts
      .filter((context) => context.freshnessStatus !== "FRESH")
      .map((context) =>
        context.lastObservationAt
          ? `Dependency series ${context.slug} is ${context.freshnessStatus.toLowerCase()} as of ${context.lastObservationAt.toISOString()}.`
          : `Dependency series ${context.slug} has unknown freshness because it has no latest observation timestamp.`
      )
  );
}

function nearestPointBefore(points: NumericPoint[], targetDate: Date): NumericPoint | null {
  const eligible = points.filter((point) => point.observedAt.getTime() <= targetDate.getTime());
  return eligible.length ? eligible[eligible.length - 1] ?? null : null;
}

function computeChangeFromDays(points: NumericPoint[], days: number): number | null {
  const latest = lastPoint(points);

  if (!latest) {
    return null;
  }

  const base = nearestPointBefore(points, new Date(latest.observedAt.getTime() - days * 24 * 60 * 60 * 1000));

  if (!base || base.value === 0) {
    return null;
  }

  return round(((latest.value - base.value) / base.value) * 100, 4);
}

function computeRollingChangeZScore(points: NumericPoint[], stepBack: number): number {
  const changes: number[] = [];

  for (let index = stepBack; index < points.length; index += 1) {
    const current = points[index];
    const base = points[index - stepBack];

    if (current && base && base.value !== 0) {
      changes.push(((current.value - base.value) / base.value) * 100);
    }
  }

  if (changes.length < 2) {
    return 0;
  }

  return computeStandaloneZScore(changes.slice(0, -1), changes[changes.length - 1] ?? 0);
}

function computeStandaloneZScore(history: number[], latest: number): number {
  if (history.length < 2) {
    return 0;
  }

  const sigma = stdDev(history);

  if (sigma === 0) {
    return 0;
  }

  return clamp((latest - mean(history)) / sigma, -3, 3);
}

function lastPoint(points: NumericPoint[]): NumericPoint | null {
  return points.length ? points[points.length - 1] ?? null : null;
}

function dedupeWarnings(warnings: string[]): string[] {
  return [...new Set(warnings)];
}
