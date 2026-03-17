import { CacheScope } from "@prisma/client";

import { cacheService } from "../../core/cache/runtime";
import { prisma } from "../../core/db/prisma";

export class DiagnosticsService {
  async getDiagnostics() {
    const cacheKey = `internal:diagnostics:${Date.now()}`;
    await cacheService.set(
      cacheKey,
      {
        ok: true
      },
      {
        scope: CacheScope.INTERNAL,
        ttlSeconds: 30,
        staleTtlSeconds: 30,
        tags: ["diagnostics"]
      }
    );
    const cacheProbe = await cacheService.get<{ ok: boolean }>(cacheKey);
    await cacheService.delete(cacheKey);

    return {
      time: new Date().toISOString(),
      database: {
        connected: true,
        dataSourceCount: await prisma.dataSource.count(),
        seriesCount: await prisma.series.count(),
        observationCount: await prisma.observation.count(),
        staleSeriesCount: await prisma.series.count({
          where: {
            freshnessStatus: "STALE"
          }
        }),
        staleDatasetCount: await prisma.dataset.count({
          where: {
            freshnessStatus: "STALE"
          }
        }),
        staleDerivedMetricCount: await prisma.derivedMetricSnapshot.count({
          where: {
            freshnessStatus: "STALE"
          }
        })
      },
      cache: {
        connected: Boolean(cacheProbe?.value.ok)
      }
    };
  }
}
