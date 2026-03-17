import { CacheService } from "./cache-service";
import { createCacheStore } from ".";

export const cacheService = new CacheService(createCacheStore());
