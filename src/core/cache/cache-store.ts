export type CacheRecord<T> = {
  value: T;
  staleAt: number;
  expiresAt: number;
  tags: string[];
  metadata?: Record<string, unknown>;
};

export interface CacheStore {
  get<T>(key: string): Promise<CacheRecord<T> | null>;
  set<T>(key: string, record: CacheRecord<T>): Promise<void>;
  delete(key: string): Promise<void>;
  invalidateByPrefix(prefix: string): Promise<number>;
  disconnect(): Promise<void>;
}
