import { createHash, timingSafeEqual } from "node:crypto";

import { FastifyRequest } from "fastify";

import { getEnv } from "../config/env";
import { UnauthorizedError } from "../errors/app-error";

const env = getEnv();

export function assertAdminAuthorized(request: FastifyRequest): void {
  const provided = request.headers["x-admin-key"];

  if (typeof provided !== "string") {
    throw new UnauthorizedError("Missing admin credentials");
  }

  const expectedBuffer = Buffer.from(env.ADMIN_API_KEY);
  const providedBuffer = Buffer.from(provided);

  if (expectedBuffer.length !== providedBuffer.length) {
    throw new UnauthorizedError("Invalid admin credentials");
  }

  if (!timingSafeEqual(expectedBuffer, providedBuffer)) {
    throw new UnauthorizedError("Invalid admin credentials");
  }
}

export function hashIpAddress(ipAddress: string | undefined): string | undefined {
  if (!ipAddress) {
    return undefined;
  }

  return createHash("sha256").update(`${env.IP_HASH_SALT}:${ipAddress}`).digest("hex");
}
