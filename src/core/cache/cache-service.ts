import { CacheScope, Prisma } from "@prisma/client";
import { createHash } from "node:crypto";

import { prisma } from "../db/prisma";
import { logger } from "../logging/logger";
import { CacheRecord, CacheStore } from "./cache-store";

export type CachePolicy = {
  scope: CacheScope;
  ttlSeconds: number;
  staleTtlSeconds: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
};

export class CacheService {
  constructor(private readonly store: CacheStore) {}

  async get<T>(key: string): Promise<CacheRecord<T> | null> {
    return this.store.get<T>(key);
  }

  async set<T>(key: string, value: T, policy: CachePolicy): Promise<CacheRecord<T>> {
    const now = Date.now();
    const record: CacheRecord<T> = {
      value,
      staleAt: now + policy.ttlSeconds * 1000,
      expiresAt: now + (policy.ttlSeconds + policy.staleTtlSeconds) * 1000,
      tags: policy.tags ?? [],
      metadata: policy.metadata
    };

    await this.store.set(key, record);

    await prisma.cacheEntry.upsert({
      where: { cacheKey: key },
      update: {
        scope: policy.scope,
        tags: record.tags,
        value: value as object,
        checksum: hashValue(value),
        ttlSeconds: policy.ttlSeconds + policy.staleTtlSeconds,
        staleAt: new Date(record.staleAt),
        expiresAt: new Date(record.expiresAt),
        metadata: (record.metadata ?? null) as Prisma.InputJsonValue
      },
      create: {
        cacheKey: key,
        scope: policy.scope,
        tags: record.tags,
        value: value as object,
        checksum: hashValue(value),
        ttlSeconds: policy.ttlSeconds + policy.staleTtlSeconds,
        staleAt: new Date(record.staleAt),
        expiresAt: new Date(record.expiresAt),
        metadata: (record.metadata ?? null) as Prisma.InputJsonValue
      }
    });

    return record;
  }

  async delete(key: string): Promise<void> {
    await this.store.delete(key);
    await prisma.cacheEntry.deleteMany({ where: { cacheKey: key } });
  }

  async invalidateByPrefix(prefix: string): Promise<number> {
    const deleted = await this.store.invalidateByPrefix(prefix);
    await prisma.cacheEntry.deleteMany({
      where: {
        cacheKey: {
          startsWith: prefix
        }
      }
    });

    logger.info({ prefix, deleted }, "Cache invalidated");
    return deleted;
  }

  async disconnect(): Promise<void> {
    await this.store.disconnect();
  }
}

function hashValue(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
