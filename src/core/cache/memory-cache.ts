import { CacheRecord, CacheStore } from "./cache-store";

export class MemoryCacheStore implements CacheStore {
  private readonly records = new Map<string, CacheRecord<unknown>>();

  async get<T>(key: string): Promise<CacheRecord<T> | null> {
    const record = this.records.get(key);

    if (!record) {
      return null;
    }

    if (record.expiresAt <= Date.now()) {
      this.records.delete(key);
      return null;
    }

    return record as CacheRecord<T>;
  }

  async set<T>(key: string, record: CacheRecord<T>): Promise<void> {
    this.records.set(key, record);
  }

  async delete(key: string): Promise<void> {
    this.records.delete(key);
  }

  async invalidateByPrefix(prefix: string): Promise<number> {
    let deleted = 0;

    for (const key of this.records.keys()) {
      if (key.startsWith(prefix)) {
        this.records.delete(key);
        deleted += 1;
      }
    }

    return deleted;
  }

  async disconnect(): Promise<void> {
    this.records.clear();
  }
}
