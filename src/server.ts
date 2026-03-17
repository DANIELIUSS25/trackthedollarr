import { createApp } from "./app";
import { getEnv } from "./core/config/env";
import { logger } from "./core/logging/logger";
import { IngestionScheduler } from "./modules/ingestion/jobs/scheduler";

async function main() {
  const env = getEnv();
  const app = await createApp();
  const scheduler = new IngestionScheduler();

  scheduler.start();

  await app.listen({
    host: env.HOST,
    port: env.PORT
  });

  logger.info(
    {
      host: env.HOST,
      port: env.PORT
    },
    "TrackTheDollar backend started"
  );
}

void main().catch((error) => {
  logger.error(
    {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    },
    "Failed to start server"
  );
  process.exit(1);
});
