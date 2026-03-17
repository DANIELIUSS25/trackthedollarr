import { IngestRunStatus } from "@prisma/client";

import { prisma } from "../../../core/db/prisma";
import { clamp, mean } from "../../../core/utils/math";
import { SourceSlug } from "../../../core/types";

export class SourceHealthService {
  async refresh(sourceSlug: SourceSlug): Promise<void> {
    const source = await prisma.dataSource.findUniqueOrThrow({
      where: { slug: sourceSlug },
      include: {
        datasets: {
          include: {
            series: true
          }
        },
        ingestRuns: {
          where: {
            startedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          },
          orderBy: {
            startedAt: "desc"
          }
        }
      }
    });

    const completedRuns = source.ingestRuns.filter((run) => run.finishedAt);
    const successRuns = completedRuns.filter((run) => run.status === IngestRunStatus.SUCCEEDED);
    const partialRuns = completedRuns.filter((run) => run.status === IngestRunStatus.PARTIAL_FAILED);
    const failureRuns = completedRuns.filter((run) => run.status === IngestRunStatus.FAILED);
    const durations = completedRuns
      .filter((run) => run.finishedAt)
      .map((run) => run.finishedAt!.getTime() - run.startedAt.getTime());
    const successRate = completedRuns.length ? (successRuns.length / completedRuns.length) * 100 : 100;
    const partialRate = completedRuns.length ? (partialRuns.length / completedRuns.length) * 100 : 0;
    const latestObservationAt = source.datasets
      .flatMap((dataset) => dataset.series.map((series) => series.lastObservationAt))
      .filter((value): value is Date => Boolean(value))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    const freshnessLagSeconds = latestObservationAt
      ? Math.floor((Date.now() - latestObservationAt.getTime()) / 1000)
      : null;
    const staleThresholdSeconds = (source.staleAfterHours ?? source.expectedLatencyHours ?? 24) * 60 * 60;
    const freshnessStatus =
      freshnessLagSeconds === null
        ? "UNKNOWN"
        : freshnessLagSeconds > staleThresholdSeconds
          ? "STALE"
          : "FRESH";

    const score = Math.round(
      clamp(
        100 -
          (100 - successRate) * 0.5 -
          partialRate * 0.2 -
          failureRuns.length * 5 -
          (freshnessLagSeconds && freshnessLagSeconds > staleThresholdSeconds
            ? Math.min(30, ((freshnessLagSeconds - staleThresholdSeconds) / staleThresholdSeconds) * 30)
            : 0),
        0,
        100
      )
    );

    await prisma.sourceHealth.upsert({
      where: {
        dataSourceId_scopeKey: {
          dataSourceId: source.id,
          scopeKey: "source"
        }
      },
      update: {
        score,
        freshnessStatus,
        freshnessLagSeconds,
        successRate24h: successRate,
        partialFailureRate24h: partialRate,
        averageLatencyMs24h: Math.round(mean(durations)),
        lastSuccessAt: successRuns[0]?.finishedAt ?? null,
        lastFailureAt: failureRuns[0]?.finishedAt ?? null,
        latestObservedDataPointAt: latestObservationAt ?? null,
        metadata: {
          completedRuns: completedRuns.length
        }
      },
      create: {
        dataSourceId: source.id,
        scopeKey: "source",
        score,
        freshnessStatus,
        freshnessLagSeconds,
        successRate24h: successRate,
        partialFailureRate24h: partialRate,
        averageLatencyMs24h: Math.round(mean(durations)),
        lastSuccessAt: successRuns[0]?.finishedAt ?? null,
        lastFailureAt: failureRuns[0]?.finishedAt ?? null,
        latestObservedDataPointAt: latestObservationAt ?? null,
        metadata: {
          completedRuns: completedRuns.length
        }
      }
    });
  }
}
