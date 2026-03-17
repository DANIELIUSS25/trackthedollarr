import { AdminAction, Prisma } from "@prisma/client";
import { FastifyRequest } from "fastify";

import { prisma } from "../../core/db/prisma";
import { hashIpAddress } from "../../core/security/admin-auth";

export class AuditService {
  async log(params: {
    action: AdminAction;
    request: FastifyRequest;
    actorId?: string;
    targetType?: string;
    targetId?: string;
    outcome: string;
    metadata?: Record<string, unknown>;
  }) {
    await prisma.adminAuditLog.create({
      data: {
        action: params.action,
        actorType: "api-key",
        actorId: params.actorId,
        requestId: params.request.id,
        route: params.request.routerPath,
        sourceIpHash: hashIpAddress(params.request.ip),
        userAgent: params.request.headers["user-agent"],
        targetType: params.targetType,
        targetId: params.targetId,
        outcome: params.outcome,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue
      }
    });
  }
}
