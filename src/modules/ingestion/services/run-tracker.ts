import { IngestRunStatus, IngestRunTrigger, Prisma, SyncMode } from "@prisma/client";

import { prisma } from "../../../core/db/prisma";
import { SourceSlug } from "../../../core/types";

export class RunTracker {
  async startRun(params: {
    sourceSlug: SourceSlug;
    datasetSlug?: string;
    trigger: IngestRunTrigger;
    syncMode?: SyncMode;
    requestedBy?: string;
    requestId?: string;
  }) {
    const dataSource = await prisma.dataSource.findUniqueOrThrow({
      where: { slug: params.sourceSlug }
    });

    const dataset = params.datasetSlug
      ? await prisma.dataset.findFirst({
          where: {
            dataSourceId: dataSource.id,
            slug: params.datasetSlug
          }
        })
      : null;

    return prisma.ingestRun.create({
      data: {
        dataSourceId: dataSource.id,
        datasetId: dataset?.id,
        trigger: params.trigger,
        syncMode: params.syncMode ?? SyncMode.INCREMENTAL,
        requestedBy: params.requestedBy,
        requestId: params.requestId
      }
    });
  }

  async logEvent(ingestRunId: string, level: "INFO" | "WARN" | "ERROR", message: string, context?: Record<string, unknown>) {
    await prisma.ingestRunEvent.create({
      data: {
        ingestRunId,
        level,
        message,
        context: (context ?? {}) as Prisma.InputJsonValue
      }
    });
  }

  async finishRun(
    ingestRunId: string,
    params: {
      status: IngestRunStatus;
      itemsDiscovered: number;
      itemsProcessed: number;
      itemsSucceeded: number;
      itemsFailed: number;
      warningsCount: number;
      errorSummary?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    return prisma.ingestRun.update({
      where: { id: ingestRunId },
      data: {
        status: params.status,
        finishedAt: new Date(),
        itemsDiscovered: params.itemsDiscovered,
        itemsProcessed: params.itemsProcessed,
        itemsSucceeded: params.itemsSucceeded,
        itemsFailed: params.itemsFailed,
        warningsCount: params.warningsCount,
        errorSummary: params.errorSummary,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue
      }
    });
  }
}
