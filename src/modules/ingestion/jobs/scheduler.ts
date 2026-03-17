import cron from "node-cron";
import { IngestRunTrigger } from "@prisma/client";

import { getEnv } from "../../../core/config/env";
import { logger } from "../../../core/logging/logger";
import { IngestionOrchestrator } from "../services/ingestion-orchestrator";

export class IngestionScheduler {
  private readonly env = getEnv();
  private readonly orchestrator = new IngestionOrchestrator();
  private readonly tasks: Array<{ stop: () => void }> = [];

  start(): void {
    if (this.env.DISABLE_SCHEDULES) {
      logger.warn("Scheduled ingestion is disabled by configuration");
      return;
    }

    this.schedule("fred", this.env.CRON_SYNC_FRED);
    this.schedule("treasury-fiscal-data", this.env.CRON_SYNC_TREASURY);
    this.schedule("federal-reserve", this.env.CRON_SYNC_FEDERAL_RESERVE);
    this.schedule("usaspending", this.env.CRON_SYNC_USASPENDING);
    this.schedule("foreign-assistance", this.env.CRON_SYNC_FOREIGN_ASSISTANCE);
    this.schedule("bls", this.env.CRON_SYNC_BLS);

    if (this.env.ENABLE_BEA) {
      this.schedule("bea", this.env.CRON_SYNC_BEA);
    }

    this.tasks.push(
      cron.schedule(this.env.CRON_DERIVE_METRICS, () => {
        void this.orchestrator.deriveMetrics();
      })
    );
    this.tasks.push(
      cron.schedule(this.env.CRON_REFRESH_STALE_STATUS, () => {
        void this.orchestrator.refreshFreshness();
      })
    );
  }

  stop(): void {
    for (const task of this.tasks) {
      task.stop();
    }
  }

  private schedule(
    sourceSlug: Parameters<IngestionOrchestrator["syncSource"]>[0],
    expression: string
  ): void {
    this.tasks.push(
      cron.schedule(expression, () => {
        void this.orchestrator.syncSource(sourceSlug, {
          trigger: IngestRunTrigger.SCHEDULED,
          requestedBy: "scheduler"
        });
      })
    );
  }
}
