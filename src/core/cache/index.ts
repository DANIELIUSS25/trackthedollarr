import Redis from "ioredis";

import { getEnv } from "../config/env";
import { MemoryCacheStore } from "./memory-cache";
import { RedisCacheStore } from "./redis-cache";

export function createCacheStore() {
  const env = getEnv();

  if (!env.REDIS_URL) {
    return new MemoryCacheStore();
  }

  const redis = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableReadyCheck: true
  });

  return new RedisCacheStore(redis);
}
