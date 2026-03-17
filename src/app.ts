import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";

import { getEnv } from "./core/config/env";
import { logger } from "./core/logging/logger";
import { registerPublicRoutes } from "./modules/api/routes/public";
import { registerAdminRoutes } from "./modules/api/routes/admin";
import { registerRequestHooks } from "./modules/observability/request-hooks";

export async function createApp() {
  const env = getEnv();
  const app = Fastify({
    logger,
    trustProxy: true,
    disableRequestLogging: true,
    requestTimeout: env.INGESTION_TIMEOUT_MS
  });

  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: false,
    hsts: env.NODE_ENV === "production"
  });
  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || env.corsAllowedOrigins.length === 0 || env.corsAllowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed"), false);
    },
    credentials: false,
    methods: ["GET", "POST"]
  });
  await app.register(rateLimit, {
    global: true,
    max: env.API_RATE_LIMIT_MAX,
    timeWindow: `${env.API_RATE_LIMIT_WINDOW_SECONDS} seconds`
  });

  registerRequestHooks(app);

  app.get("/healthz", async () => ({
    ok: true,
    time: new Date().toISOString()
  }));

  await registerPublicRoutes(app);
  await registerAdminRoutes(app);

  return app;
}
