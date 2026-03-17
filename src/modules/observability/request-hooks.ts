import { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

import { AppError } from "../../core/errors/app-error";
import { logger } from "../../core/logging/logger";

export function registerRequestHooks(app: any): void {
  app.addHook("onRequest", async (request: any) => {
    request.headers["x-request-id"] = request.id;
  });

  app.addHook("onResponse", async (request: any, reply: any) => {
    logger.info(
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTimeMs: reply.elapsedTime
      },
      "Request completed"
    );
  });

  app.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof ZodError) {
      reply.status(400).send({
        error: {
          code: "INPUT_VALIDATION_ERROR",
          message: "Request validation failed",
          details: error.issues
        },
        requestId: request.id
      });
      return;
    }

    if (error instanceof AppError) {
      reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.expose ? error.message : "An unexpected error occurred"
        },
        requestId: request.id
      });
      return;
    }

    logger.error(
      {
        requestId: request.id,
        error: error.message,
        stack: error.stack
      },
      "Unhandled request error"
    );

    reply.status(500).send({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred"
      },
      requestId: request.id
    });
  });
}
