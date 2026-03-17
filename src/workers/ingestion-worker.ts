import { IngestRunTrigger, SyncMode } from "@prisma/client";

import { logger } from "../core/logging/logger";
import { sourceSlugs } from "../core/types";
import { IngestionOrchestrator } from "../modules/ingestion/services/ingestion-orchestrator";
import { CatalogSeeder } from "../modules/ingestion/services/catalog-seeder";

async function main() {
  const orchestrator = new IngestionOrchestrator();
  const [command, source] = process.argv.slice(2);

  switch (command) {
    case "sync-all": {
      const result = await orchestrator.syncAll({
        trigger: IngestRunTrigger.MANUAL,
        requestedBy: "cli"
      });
      logger.info({ result }, "Completed sync-all");
      break;
    }
    case "sync-source": {
      if (!source || !sourceSlugs.includes(source as (typeof sourceSlugs)[number])) {
        throw new Error(`A valid source slug is required. Expected one of: ${sourceSlugs.join(", ")}`);
      }

      const result = await orchestrator.syncSource(source as (typeof sourceSlugs)[number], {
        trigger: IngestRunTrigger.MANUAL,
        syncMode: SyncMode.INCREMENTAL,
        requestedBy: "cli"
      });
      logger.info({ result }, "Completed sync-source");
      break;
    }
    case "derive": {
      const result = await orchestrator.deriveMetrics();
      logger.info({ result }, "Completed metric derivation");
      break;
    }
    case "freshness": {
      const result = await orchestrator.refreshFreshness(
        source && sourceSlugs.includes(source as (typeof sourceSlugs)[number])
          ? (source as (typeof sourceSlugs)[number])
          : undefined
      );
      logger.info({ result }, "Completed freshness refresh");
      break;
    }
    case "seed": {
      await new CatalogSeeder().seed();
      logger.info("Seeded catalog definitions");
      break;
    }
    default:
      throw new Error("Unknown command. Use one of: seed, sync-all, sync-source, derive, freshness");
  }
}

void main().catch((error) => {
  logger.error(
    {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    },
    "Worker failed"
  );
  process.exit(1);
});
