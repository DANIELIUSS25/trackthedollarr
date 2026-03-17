import { IngestRunStatus, IngestRunTrigger, SyncMode } from "@prisma/client";

import { logger } from "../../../core/logging/logger";
import { SourceSlug } from "../../../core/types";
import { SourceRegistry } from "../../sources/registry/source-registry";
import { DerivedMetricService } from "../../metrics/services/derived-metric-service";
import { ObservationRepository } from "../repositories/observation-repository";
import { CatalogSeeder } from "./catalog-seeder";
import { RunTracker } from "./run-tracker";
import { StaleDataService } from "./stale-data-service";
import { SourceHealthService } from "./source-health-service";

export class IngestionOrchestrator {
  private readonly seeder = new CatalogSeeder();
  private readonly registry = new SourceRegistry();
  private readonly repository = new ObservationRepository();
  private readonly runTracker = new RunTracker();
  private readonly healthService = new SourceHealthService();
  private readonly derivedMetricService = new DerivedMetricService();
  private readonly staleDataService = new StaleDataService();

  async syncAll(params: { trigger?: IngestRunTrigger; requestedBy?: string; requestId?: string } = {}) {
    await this.seeder.seed();

    const reports = [];

    for (const adapter of this.registry.getAll()) {
      try {
        reports.push(
          await this.syncSource(adapter.sourceSlug, {
            trigger: params.trigger ?? IngestRunTrigger.SCHEDULED,
            requestedBy: params.requestedBy,
            requestId: params.requestId
          })
        );
      } catch (error) {
        logger.error(
          {
            source: adapter.sourceSlug,
            error: error instanceof Error ? error.message : String(error)
          },
          "Source sync failed"
        );
        reports.push({
          sourceSlug: adapter.sourceSlug,
          status: IngestRunStatus.FAILED,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    await this.derivedMetricService.computeAndPersistSnapshots();
    await this.staleDataService.refreshFreshness();

    return reports;
  }

  async syncSource(
    sourceSlug: SourceSlug,
    params: {
      datasetSlug?: string;
      trigger?: IngestRunTrigger;
      syncMode?: SyncMode;
      requestedBy?: string;
      requestId?: string;
      seriesSlugs?: string[];
      lookbackDays?: number;
    } = {}
  ) {
    await this.seeder.seed();

    const run = await this.runTracker.startRun({
      sourceSlug,
      datasetSlug: params.datasetSlug,
      trigger: params.trigger ?? IngestRunTrigger.MANUAL,
      syncMode: params.syncMode ?? SyncMode.INCREMENTAL,
      requestedBy: params.requestedBy,
      requestId: params.requestId
    });

    try {
      const result = await this.registry.get(sourceSlug).sync({
        datasetSlugs: params.datasetSlug ? [params.datasetSlug] : undefined,
        seriesSlugs: params.seriesSlugs,
        lookbackDays: params.lookbackDays
      });
      await this.runTracker.logEvent(run.id, "INFO", "Adapter sync completed", {
        sourceSlug,
        datasetCount: result.datasets.length,
        warnings: result.warnings.length
      });
      const persistence = await this.repository.persistSyncResult(result, run.id);
      const status =
        persistence.itemsFailed > 0 || result.warnings.length > 0
          ? IngestRunStatus.PARTIAL_FAILED
          : IngestRunStatus.SUCCEEDED;

      await this.runTracker.finishRun(run.id, {
        status,
        ...persistence,
        metadata: {
          sourceWarnings: result.warnings
        }
      });
      await this.healthService.refresh(sourceSlug);
      await this.staleDataService.refreshFreshness(sourceSlug);

      return {
        sourceSlug,
        status,
        ...persistence,
        warnings: result.warnings
      };
    } catch (error) {
      await this.runTracker.logEvent(run.id, "ERROR", "Adapter sync failed", {
        sourceSlug,
        error: error instanceof Error ? error.message : String(error)
      });
      await this.runTracker.finishRun(run.id, {
        status: IngestRunStatus.FAILED,
        itemsDiscovered: 0,
        itemsProcessed: 0,
        itemsSucceeded: 0,
        itemsFailed: 1,
        warningsCount: 0,
        errorSummary: error instanceof Error ? error.message : "Unknown sync error"
      });
      await this.healthService.refresh(sourceSlug);
      await this.staleDataService.refreshFreshness(sourceSlug);
      throw error;
    }
  }

  async deriveMetrics() {
    await this.seeder.seed();
    const snapshots = await this.derivedMetricService.computeAndPersistSnapshots();
    await this.staleDataService.refreshFreshness();
    return snapshots;
  }

  async refreshFreshness(sourceSlug?: SourceSlug) {
    await this.seeder.seed();
    const summary = await this.staleDataService.refreshFreshness(sourceSlug);

    if (sourceSlug) {
      await this.healthService.refresh(sourceSlug);
    } else {
      for (const adapter of this.registry.getAll()) {
        await this.healthService.refresh(adapter.sourceSlug);
      }
    }

    return summary;
  }
}
