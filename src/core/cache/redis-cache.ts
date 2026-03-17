import Redis from "ioredis";

import { CacheRecord, CacheStore } from "./cache-store";

export class RedisCacheStore implements CacheStore {
  constructor(private readonly redis: Redis) {}

  async get<T>(key: string): Promise<CacheRecord<T> | null> {
    const payload = await this.redis.get(key);
    return payload ? (JSON.parse(payload) as CacheRecord<T>) : null;
  }

  async set<T>(key: string, record: CacheRecord<T>): Promise<void> {
    const ttl = Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000));
    await this.redis.set(key, JSON.stringify(record), "EX", ttl);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async invalidateByPrefix(prefix: string): Promise<number> {
    let cursor = "0";
    let deleted = 0;

    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        deleted += keys.length;
        await this.redis.del(...keys);
      }
    } while (cursor !== "0");

    return deleted;
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
