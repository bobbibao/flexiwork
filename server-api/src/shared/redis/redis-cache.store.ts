import Redis from 'ioredis';
import type { Store } from 'cache-manager';

/**
 * cache-manager v5 Store on ioredis (PLAN.md P12.2), so CACHE_DRIVER=redis shares the legacy CacheService
 * values across api instances without a new dependency. Values are JSON; ttl is in milliseconds (0 = no expiry).
 * Keys are prefixed so reset() only clears this cache, never locks, idempotency keys or BullMQ data.
 */
export function redisCacheStore(url: string, defaultTtlMs = 0, prefix = 'cache:'): Store {
  const redis = new Redis(url, { maxRetriesPerRequest: 3 });
  const k = (key: string) => `${prefix}${key}`;
  const decode = <T>(raw: string | null): T | undefined => (raw === null ? undefined : (JSON.parse(raw) as T));
  const write = async (key: string, value: unknown, ttl?: number) => {
    const ms = ttl ?? defaultTtlMs;
    const json = JSON.stringify(value === undefined ? null : value);
    if (ms > 0) await redis.set(k(key), json, 'PX', ms);
    else await redis.set(k(key), json);
  };
  const scan = async (pattern: string): Promise<string[]> => {
    const found: string[] = [];
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 500);
      found.push(...keys);
      cursor = next;
    } while (cursor !== '0');
    return found;
  };
  return {
    get: async <T>(key: string) => decode<T>(await redis.get(k(key))),
    set: async (key, data, ttl) => write(key, data, ttl),
    del: async (key) => {
      await redis.del(k(key));
    },
    reset: async () => {
      const keys = await scan(`${prefix}*`);
      if (keys.length) await redis.del(...keys);
    },
    mset: async (pairs, ttl) => {
      for (const [key, value] of pairs) await write(key, value, ttl);
    },
    mget: async (...keys) => (keys.length ? (await redis.mget(...keys.map(k))).map((raw) => decode(raw)) : []),
    mdel: async (...keys) => {
      if (keys.length) await redis.del(...keys.map(k));
    },
    keys: async (pattern = '*') => (await scan(`${prefix}${pattern}`)).map((key) => key.slice(prefix.length)),
    ttl: async (key) => redis.pttl(k(key)),
  };
}
