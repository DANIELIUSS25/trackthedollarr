import { Frequency, Prisma, Series } from "@prisma/client";

import { prisma } from "../../../core/db/prisma";
import { logger } from "../../../core/logging/logger";
import { AdapterSyncResult, NormalizedObservation } from "../../sources/adapters/base-adapter";
import { UnitNormalizer } from "../services/unit-normalizer";

export type PersistenceSummary = {
  itemsDiscovered: number;
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  warningsCount: number;
};

export class ObservationRepository {
  private readonly unitNormalizer = new UnitNormalizer();

  async persistSyncResult(result: AdapterSyncResult, ingestRunId: string): Promise<PersistenceSummary> {
    const datasets = await prisma.dataset.findMany({
      where: {
        dataSource: {
          slug: result.sourceSlug
        }
      },
      include: {
        series: true,
        dataSource: true
      }
    });

    const datasetMap = new Map(datasets.map((dataset) => [dataset.slug, dataset]));
    let itemsDiscovered = 0;
    let itemsProcessed = 0;
    let itemsSucceeded = 0;
    let itemsFailed = 0;
    let warningsCount = result.warnings.length;

    for (const datasetBundle of result.datasets) {
      const datasetRecord = datasetMap.get(datasetBundle.datasetSlug);

      if (!datasetRecord) {
        itemsFailed += datasetBundle.series.length;
        continue;
      }

      warningsCount += datasetBundle.warnings.length;
      await prisma.dataset.update({
        where: { id: datasetRecord.id },
        data: {
          lastAttemptedSyncAt: new Date()
        }
      });

      const seriesMap = new Map(datasetRecord.series.map((series) => [series.slug, series]));
      let datasetHadFailures = false;

      for (const seriesBundle of datasetBundle.series) {
        const seriesRecord = seriesMap.get(seriesBundle.seriesSlug);

        itemsDiscovered += seriesBundle.observations.length;

        if (!seriesRecord) {
          itemsFailed += seriesBundle.observations.length || 1;
          datasetHadFailures = true;
          logger.warn(
            {
              sourceSlug: result.sourceSlug,
              datasetSlug: datasetBundle.datasetSlug,
              seriesSlug: seriesBundle.seriesSlug
            },
            "Skipping unknown series bundle during persistence"
          );
          continue;
        }

        try {
          const resultSummary = await this.persistSeries(seriesRecord, seriesBundle.observations, ingestRunId);
          itemsProcessed += resultSummary.processed;
          itemsSucceeded += resultSummary.succeeded;
          itemsFailed += resultSummary.failed;
          warningsCount += resultSummary.warnings;
        } catch {
          itemsFailed += seriesBundle.observations.length || 1;
          datasetHadFailures = true;
          logger.error(
            {
              sourceSlug: result.sourceSlug,
              datasetSlug: datasetBundle.datasetSlug,
              seriesSlug: seriesBundle.seriesSlug
            },
            "Failed to persist normalized series bundle"
          );
        }
      }

      await prisma.dataset.update({
        where: { id: datasetRecord.id },
        data: {
          lastSuccessfulSyncAt: datasetHadFailures ? datasetRecord.lastSuccessfulSyncAt : new Date(),
          freshnessStatus: datasetHadFailures ? datasetRecord.freshnessStatus : "FRESH"
        }
      });
    }

    await prisma.dataSource.update({
      where: {
        slug: result.sourceSlug
      },
      data: {
        lastAttemptedSyncAt: new Date(),
        lastSuccessfulSyncAt: itemsFailed >= itemsSucceeded && itemsSucceeded === 0 ? undefined : new Date()
      }
    });

    return {
      itemsDiscovered,
      itemsProcessed,
      itemsSucceeded,
      itemsFailed,
      warningsCount
    };
  }

  private async persistSeries(
    series: Series,
    observations: NormalizedObservation[],
    ingestRunId: string
  ): Promise<{ processed: number; succeeded: number; failed: number; warnings: number }> {
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    let warnings = 0;

    for (const observation of observations.sort((a, b) => a.observedAt.getTime() - b.observedAt.getTime())) {
      processed += 1;

      try {
        const normalizedObservation = this.unitNormalizer.normalizeObservation(series, observation);
        warnings += normalizedObservation.warnings?.length ?? 0;
        const latest = await prisma.observation.findFirst({
          where: {
            seriesId: series.id,
            observedAt: normalizedObservation.observedAt,
            isLatestRevision: true
          },
          orderBy: {
            revisionOrdinal: "desc"
          }
        });

        if (latest && observationMatches(latest, normalizedObservation)) {
          succeeded += 1;
          continue;
        }

        await prisma.$transaction(async (tx) => {
          if (latest) {
            await tx.observation.update({
              where: { id: latest.id },
              data: {
                isLatestRevision: false
              }
            });
          }

          await tx.observation.create({
            data: {
              seriesId: series.id,
              ingestRunId,
              observedAt: normalizedObservation.observedAt,
              numericValue: normalizedObservation.numericValue ?? null,
              textValue: normalizedObservation.textValue ?? null,
              jsonValue: (normalizedObservation.jsonValue ?? null) as Prisma.InputJsonValue,
              revisionOrdinal: latest ? latest.revisionOrdinal + 1 : 1,
              valueStatus: latest ? "REVISED" : normalizedObservation.valueStatus ?? "FINAL",
              isLatestRevision: true,
              sourceObservationKey: normalizedObservation.sourceObservationKey,
              sourcePublishedAt: normalizedObservation.sourcePublishedAt,
              sourceUpdatedAt: normalizedObservation.sourceUpdatedAt,
              sourceUrl: normalizedObservation.sourceUrl,
              sourceUnit: normalizedObservation.sourceUnit ?? series.unit,
              sourceFrequency: normalizedObservation.sourceFrequency ?? series.frequency,
              stale: false,
              warnings: normalizedObservation.warnings ?? [],
              metadata: (normalizedObservation.metadata ?? {}) as Prisma.InputJsonValue
            }
          });

          await tx.series.update({
            where: { id: series.id },
            data: {
              lastAttemptedSyncAt: new Date(),
              lastSuccessfulSyncAt: new Date(),
              lastObservationAt: normalizedObservation.observedAt,
              freshnessStatus: "FRESH"
            }
          });
        });

        succeeded += 1;
      } catch (error) {
        failed += 1;
        logger.error(
          {
            seriesSlug: series.slug,
            observedAt: observation.observedAt.toISOString(),
            sourceObservationKey: observation.sourceObservationKey,
            error: error instanceof Error ? error.message : String(error)
          },
          "Failed to persist normalized observation"
        );
      }
    }

    if (observations.length === 0) {
      await prisma.series.update({
        where: { id: series.id },
        data: {
          lastAttemptedSyncAt: new Date()
        }
      });
    }

    return {
      processed,
      succeeded,
      failed,
      warnings
    };
  }
}

function observationMatches(existing: Prisma.ObservationGetPayload<{}>, incoming: NormalizedObservation): boolean {
  const existingNumeric = existing.numericValue ? Number(existing.numericValue) : null;
  const numericEqual = existingNumeric === (incoming.numericValue ?? null);
  const textEqual = existing.textValue === (incoming.textValue ?? null);
  const jsonEqual = JSON.stringify(existing.jsonValue ?? null) === JSON.stringify(incoming.jsonValue ?? null);
  const keyEqual = existing.sourceObservationKey === (incoming.sourceObservationKey ?? null);

  return numericEqual && textEqual && jsonEqual && keyEqual;
}
