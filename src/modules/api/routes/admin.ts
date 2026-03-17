import { AdminAction, IngestRunTrigger, SyncMode } from "@prisma/client";
import { cacheService } from "../../../core/cache/runtime";
import { assertAdminAuthorized } from "../../../core/security/admin-auth";
import { prisma } from "../../../core/db/prisma";
import { IngestionOrchestrator } from "../../ingestion/services/ingestion-orchestrator";
import { AuditService } from "../../admin/audit-service";
import { DiagnosticsService } from "../../health/diagnostics-service";
import { StaleDataService } from "../../ingestion/services/stale-data-service";
import {
  adminFreshnessRefreshSchema,
  adminIngestRunsQuerySchema,
  adminInvalidateCacheSchema,
  adminRefreshSchema,
  adminStaleAlertsQuerySchema,
  sourceHealthQuerySchema
} from "../schemas/query-schemas";
import { makeEnvelope } from "../serializers/envelope";
import { PlatformReadService } from "../services/platform-read-service";

const orchestrator = new IngestionOrchestrator();
const auditService = new AuditService();
const diagnosticsService = new DiagnosticsService();
const readService = new PlatformReadService();
const staleDataService = new StaleDataService();

export async function registerAdminRoutes(app: any) {
  app.addHook("preHandler", async (request: any) => {
    if (request.url.startsWith("/api/internal")) {
      assertAdminAuthorized(request);
    }
  });

  app.post("/api/internal/refresh", async (request: any) => {
    const body = adminRefreshSchema.parse(request.body ?? {});
    const result = await orchestrator.syncSource(body.source, {
      datasetSlug: body.dataset,
      seriesSlugs: body.seriesSlugs,
      lookbackDays: body.lookbackDays,
      trigger: IngestRunTrigger.MANUAL,
      syncMode: body.mode === "full" ? SyncMode.FULL : SyncMode.INCREMENTAL,
      requestedBy: "admin-api",
      requestId: request.id
    });
    await auditService.log({
      action: AdminAction.MANUAL_REFRESH,
      request,
      targetType: "source",
      targetId: body.source,
      outcome: result.status,
      metadata: body
    });

    return makeEnvelope({
      data: result,
      metadata: {
        version: "v1"
      }
    });
  });

  app.get("/api/internal/source-health", async (request: any) => {
    const query = sourceHealthQuerySchema.parse(request.query ?? {});
    const data = await readService.getSourceHealth(query.source);
    await auditService.log({
      action: AdminAction.SOURCE_HEALTH_INSPECT,
      request,
      targetType: "source",
      targetId: query.source,
      outcome: "ok"
    });

    return makeEnvelope({
      data,
      metadata: {
        version: "v1"
      }
    });
  });

  app.get("/api/internal/ingest-runs", async (request: any) => {
    const query = adminIngestRunsQuerySchema.parse(request.query ?? {});
    const data = await prisma.ingestRun.findMany({
      where: query.source
        ? {
            dataSource: {
              slug: query.source
            }
          }
        : undefined,
      include: {
        dataSource: true,
        dataset: true,
        events: {
          orderBy: {
            createdAt: "asc"
          },
          take: 50
        }
      },
      orderBy: {
        startedAt: "desc"
      },
      take: query.limit
    });
    await auditService.log({
      action: AdminAction.INGEST_RUN_INSPECT,
      request,
      targetType: "source",
      targetId: query.source,
      outcome: "ok"
    });

    return makeEnvelope({
      data,
      metadata: {
        version: "v1",
        limit: query.limit
      }
    });
  });

  app.post("/api/internal/freshness/refresh", async (request: any) => {
    const body = adminFreshnessRefreshSchema.parse(request.body ?? {});
    const data = await orchestrator.refreshFreshness(body.source);
    await auditService.log({
      action: AdminAction.FRESHNESS_REFRESH,
      request,
      targetType: body.source ? "source" : "platform",
      targetId: body.source ?? "all",
      outcome: "ok",
      metadata: body
    });

    return makeEnvelope({
      data,
      metadata: {
        version: "v1"
      }
    });
  });

  app.get("/api/internal/stale-alerts", async (request: any) => {
    const query = adminStaleAlertsQuerySchema.parse(request.query ?? {});
    const data = await staleDataService.getStaleAlerts({
      limit: query.limit,
      scope: query.scope,
      sourceSlug: query.source
    });
    await auditService.log({
      action: AdminAction.STALE_DATA_INSPECT,
      request,
      targetType: query.scope,
      targetId: query.source ?? "all",
      outcome: "ok",
      metadata: query
    });

    return makeEnvelope({
      data,
      metadata: {
        version: "v1",
        scope: query.scope,
        limit: query.limit
      }
    });
  });

  app.post("/api/internal/cache/invalidate", async (request: any) => {
    const body = adminInvalidateCacheSchema.parse(request.body ?? {});
    const deleted = body.key ? (await cacheService.delete(body.key), 1) : await cacheService.invalidateByPrefix(body.prefix!);
    await auditService.log({
      action: AdminAction.CACHE_INVALIDATE,
      request,
      targetType: body.key ? "cache-key" : "cache-prefix",
      targetId: body.key ?? body.prefix,
      outcome: "ok",
      metadata: body
    });

    return makeEnvelope({
      data: {
        deleted
      },
      metadata: {
        version: "v1"
      }
    });
  });

  app.get("/api/internal/diagnostics", async (request: any) => {
    const data = await diagnosticsService.getDiagnostics();
    await auditService.log({
      action: AdminAction.SYSTEM_DIAGNOSTIC,
      request,
      outcome: "ok"
    });

    return makeEnvelope({
      data,
      metadata: {
        version: "v1"
      }
    });
  });
}
