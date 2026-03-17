import { CacheScope } from "@prisma/client";
import { cacheService } from "../../../core/cache/runtime";
import { getEnv } from "../../../core/config/env";
import { PlatformReadService } from "../services/platform-read-service";
import {
  defenseSpendingQuerySchema,
  foreignAssistanceQuerySchema,
  methodologyQuerySchema,
  seriesQuerySchema,
  sourceHealthQuerySchema
} from "../schemas/query-schemas";
import { makeEnvelope } from "../serializers/envelope";

const readService = new PlatformReadService();
const env = getEnv();

export async function registerPublicRoutes(app: any) {
  app.get("/api/v1/overview", async (request: any, reply: any) => {
    const query = seriesQuerySchema.parse(request.query ?? {});
    return sendCached(reply, `public:overview:${JSON.stringify(query)}`, async () =>
      makeEnvelope({
        data: await readService.getOverview(query),
        metadata: {
          version: "v1",
          range: query.range,
          frequency: query.frequency
        }
      })
    );
  });

  app.get("/api/v1/dollar-strength", async (request: any, reply: any) => {
    const query = seriesQuerySchema.parse(request.query ?? {});
    return sendCached(reply, `public:dollar-strength:${JSON.stringify(query)}`, async () =>
      makeEnvelope({
        data: {
          series: await readService.getSeriesPayload("dollar-broad-index", query),
          metric: await readService.getMetricPayload("dollar-strength-zscore")
        },
        metadata: {
          version: "v1"
        }
      })
    );
  });

  app.get("/api/v1/debt", async (request: any, reply: any) => {
    const query = seriesQuerySchema.parse(request.query ?? {});
    return sendCached(reply, `public:debt:${JSON.stringify(query)}`, async () =>
      makeEnvelope({
        data: {
          totalDebt: await readService.getSeriesPayload("total-public-debt-outstanding", query),
          debtHeldByPublic: await readService.getSeriesPayload("debt-held-by-public", query),
          intragovernmental: await readService.getSeriesPayload("intragovernmental-holdings", query),
          debtGrowthVelocity: await readService.getMetricPayload("debt-growth-velocity")
        },
        metadata: {
          version: "v1"
        }
      })
    );
  });

  app.get("/api/v1/inflation", async (request: any, reply: any) => {
    const query = seriesQuerySchema.parse(request.query ?? {});
    return sendCached(reply, `public:inflation:${JSON.stringify(query)}`, async () =>
      makeEnvelope({
        data: {
          cpi: await readService.getSeriesPayload("cpi-all-items", query),
          coreCpi: await readService.getSeriesPayload("core-cpi", query),
          breakeven5y: await readService.getSeriesPayload("breakeven-inflation-5y", query)
        },
        metadata: {
          version: "v1"
        }
      })
    );
  });

  app.get("/api/v1/rates", async (request: any, reply: any) => {
    const query = seriesQuerySchema.parse(request.query ?? {});
    return sendCached(reply, `public:rates:${JSON.stringify(query)}`, async () =>
      makeEnvelope({
        data: {
          fedFunds: await readService.getSeriesPayload("effective-fed-funds-rate", query),
          treasury2y: await readService.getSeriesPayload("treasury-2y-yield", query),
          treasury10y: await readService.getSeriesPayload("treasury-10y-yield", query)
        },
        metadata: {
          version: "v1"
        }
      })
    );
  });

  app.get("/api/v1/money-supply", async (request: any, reply: any) => {
    const query = seriesQuerySchema.parse(request.query ?? {});
    return sendCached(reply, `public:money-supply:${JSON.stringify(query)}`, async () =>
      makeEnvelope({
        data: {
          m2: await readService.getSeriesPayload("m2-money-stock", query),
          fedAssets: await readService.getSeriesPayload("fed-total-assets", query),
          reserveBalances: await readService.getSeriesPayload("reserve-balances", query)
        },
        metadata: {
          version: "v1"
        }
      })
    );
  });

  app.get("/api/v1/money-printing-proxy", async (_request: any, reply: any) => {
    return sendCached(reply, "public:money-printing-proxy", async () =>
      makeEnvelope({
        data: await readService.getMetricPayload("monetary-expansion-proxy"),
        metadata: {
          version: "v1"
        },
        warnings: ["Derived proxy. Not an official money-printing counter."]
      })
    );
  });

  app.get("/api/v1/war-spending-proxy", async (_request: any, reply: any) => {
    return sendCached(reply, "public:war-spending-proxy", async () =>
      makeEnvelope({
        data: await readService.getMetricPayload("war-spending-proxy"),
        metadata: {
          version: "v1"
        },
        warnings: ["Derived proxy. Not an official war-spending counter."]
      })
    );
  });

  app.get("/api/v1/defense-spending", async (request: any, reply: any) => {
    const query = defenseSpendingQuerySchema.parse(request.query ?? {});
    return sendCached(reply, `public:defense-spending:${JSON.stringify(query)}`, async () =>
      makeEnvelope({
        data: await readService.getDefenseSpending(query),
        metadata: {
          version: "v1",
          agency: query.agency,
          category: query.category
        }
      })
    );
  });

  app.get("/api/v1/foreign-assistance", async (request: any, reply: any) => {
    const query = foreignAssistanceQuerySchema.parse(request.query ?? {});
    return sendCached(reply, `public:foreign-assistance:${JSON.stringify(query)}`, async () =>
      makeEnvelope({
        data: await readService.getForeignAssistance(query),
        metadata: {
          version: "v1",
          category: query.category,
          country: query.country ?? null
        }
      })
    );
  });

  app.get("/api/v1/series/:slug", async (request: any, reply: any) => {
    const query = seriesQuerySchema.parse(request.query ?? {});
    const slug = String((request.params as { slug: string }).slug);
    return sendCached(reply, `public:series:${slug}:${JSON.stringify(query)}`, async () =>
      makeEnvelope({
        data: await readService.getSeriesPayload(slug, query),
        metadata: {
          version: "v1",
          slug
        }
      })
    );
  });

  app.get("/api/v1/methodology", async (request: any, reply: any) => {
    const query = methodologyQuerySchema.parse(request.query ?? {});
    return sendCached(reply, `public:methodology:${query.slug ?? "all"}`, async () =>
      makeEnvelope({
        data: await readService.getMethodology(query.slug),
        metadata: {
          version: "v1"
        }
      })
    );
  });

  app.get("/api/v1/source-health", async (request: any, reply: any) => {
    const query = sourceHealthQuerySchema.parse(request.query ?? {});
    return sendCached(reply, `public:source-health:${query.source ?? "all"}`, async () =>
      makeEnvelope({
        data: await readService.getSourceHealth(query.source),
        metadata: {
          version: "v1"
        }
      })
    );
  });
}

async function sendCached<T>(
  reply: any,
  key: string,
  compute: () => Promise<T>
): Promise<T> {
  const cached = await cacheService.get<T>(key);

  reply.header(
    "Cache-Control",
    `public, max-age=${env.CACHE_DEFAULT_TTL_SECONDS}, stale-while-revalidate=${env.CACHE_STALE_TTL_SECONDS}`
  );

  if (cached && cached.staleAt > Date.now()) {
    reply.header("x-cache-status", "HIT");
    return cached.value;
  }

  if (cached) {
    reply.header("x-cache-status", "STALE");
    void compute().then(async (fresh) => {
      await cacheService.set(key, fresh, {
        scope: CacheScope.ENDPOINT,
        ttlSeconds: env.CACHE_DEFAULT_TTL_SECONDS,
        staleTtlSeconds: env.CACHE_STALE_TTL_SECONDS,
        tags: ["public-endpoint"]
      });
    });
    return cached.value;
  }

  const fresh = await compute();
  await cacheService.set(key, fresh, {
    scope: CacheScope.ENDPOINT,
    ttlSeconds: env.CACHE_DEFAULT_TTL_SECONDS,
    staleTtlSeconds: env.CACHE_STALE_TTL_SECONDS,
    tags: ["public-endpoint"]
  });
  reply.header("x-cache-status", "MISS");
  return fresh;
}
