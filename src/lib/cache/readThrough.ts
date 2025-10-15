/**
 * Redis Read-Through Cache
 * 
 * Drop-in caching layer using Upstash REST API.
 * Works in both Deno (edge functions) and browser contexts.
 */

type JSONish = unknown;

// Type-safe Deno check
declare const Deno: any;

// Environment-aware Redis config
const getRedisConfig = () => {
  // Check if running in Deno (edge functions)
  const isDeno = typeof globalThis !== 'undefined' && 
                 'Deno' in globalThis && 
                 typeof (globalThis as any).Deno?.env?.get === 'function';
  
  if (isDeno) {
    // Deno/Edge context
    const denoEnv = (globalThis as any).Deno.env;
    return {
      url: denoEnv.get('UPSTASH_REDIS_REST_URL'),
      token: denoEnv.get('UPSTASH_REDIS_REST_TOKEN'),
    };
  }
  
  // Browser context (would need proxy or different strategy)
  // For now, Redis cache is only enabled in edge functions
  return {
    url: undefined,
    token: undefined,
  };
};

async function redisGet(key: string): Promise<string | null> {
  const config = getRedisConfig();
  if (!config.url || !config.token) {
    console.warn('[Cache] Redis not configured, skipping cache');
    return null;
  }

  try {
    const r = await fetch(`${config.url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${config.token}` },
    });
    if (!r.ok) return null;
    const { result } = await r.json();
    return result ?? null;
  } catch (err) {
    console.error('[Cache] Redis GET failed:', err);
    return null;
  }
}

async function redisSetEx(key: string, ttl: number, val: string): Promise<void> {
  const config = getRedisConfig();
  if (!config.url || !config.token) return;

  try {
    await fetch(
      `${config.url}/set/${encodeURIComponent(key)}/${encodeURIComponent(val)}?EX=${ttl}`,
      {
        headers: { Authorization: `Bearer ${config.token}` },
      }
    );
  } catch (err) {
    console.error('[Cache] Redis SET failed:', err);
  }
}

/**
 * Read-through cache pattern
 * 
 * @param key - Cache key (use tenant_id:resource:id pattern)
 * @param ttlSec - Time to live in seconds
 * @param fetcher - Function to fetch data on cache miss
 * @returns Cached or freshly fetched data
 * 
 * @example
 * ```ts
 * const data = await readThrough(
 *   `${tenantId}:listing:${listingId}`,
 *   30,
 *   () => db.getListing(listingId)
 * );
 * ```
 */
export async function readThrough<T extends JSONish>(
  key: string,
  ttlSec: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Try cache first
  const hit = await redisGet(key);
  if (hit) {
    try {
      return JSON.parse(hit) as T;
    } catch {
      // Invalid JSON in cache, fall through to fetch
    }
  }

  // Cache miss - fetch data
  const data = await fetcher();

  // Don't cache PII-prefixed keys or null/undefined
  if (!key.startsWith('pii:') && data != null) {
    await redisSetEx(key, ttlSec, JSON.stringify(data));
  }

  return data;
}

/**
 * Invalidate cache key(s)
 * 
 * @example
 * ```ts
 * await invalidate(`${tenantId}:listing:${listingId}`);
 * ```
 */
export async function invalidate(keyPattern: string): Promise<void> {
  const config = getRedisConfig();
  if (!config.url || !config.token) return;

  try {
    await fetch(`${config.url}/del/${encodeURIComponent(keyPattern)}`, {
      headers: { Authorization: `Bearer ${config.token}` },
    });
  } catch (err) {
    console.error('[Cache] Redis DEL failed:', err);
  }
}

/**
 * Common cache key builders
 */
export const CacheKeys = {
  listing: (tenantId: string, id: string) => `${tenantId}:listing:${id}`,
  listings: (tenantId: string, page: number) => `${tenantId}:listings:page:${page}`,
  profile: (tenantId: string, userId: string) => `${tenantId}:profile:${userId}`,
  event: (tenantId: string, id: string) => `${tenantId}:event:${id}`,
  horse: (tenantId: string, id: string) => `${tenantId}:horse:${id}`,
};
