/**
 * Redis cache wrapper with stampede protection
 * Ready to use once REDIS_URL env var is set
 */

// Type-safe cache wrapper
export async function cached<T>(
  key: string,
  ttlSec: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // If Redis not configured, skip cache
  if (!import.meta.env.VITE_REDIS_URL) {
    return fetcher();
  }

  try {
    const redis = await getRedisClient();
    
    // Try cache hit
    const hit = await redis.get(key);
    if (hit) {
      logCacheMetric('hit', key);
      return JSON.parse(hit);
    }

    // Stampede protection: try to acquire lock
    const lockKey = `lock:${key}`;
    const gotLock = await redis.set(lockKey, '1', 'NX', 'EX', 3);
    
    if (!gotLock) {
      // Another request is fetching, wait briefly and retry
      await new Promise(r => setTimeout(r, 80 + Math.random() * 120));
      const retry = await redis.get(key);
      if (retry) {
        logCacheMetric('hit_after_wait', key);
        return JSON.parse(retry);
      }
    }

    // Fetch fresh data
    logCacheMetric('miss', key);
    const data = await fetcher();
    
    // Store in cache and release lock
    await Promise.all([
      redis.set(key, JSON.stringify(data), 'EX', ttlSec),
      redis.del(lockKey),
    ]);
    
    return data;
  } catch (err) {
    // Cache failure shouldn't break app - fallback to fetcher
    console.warn('Cache error, falling back to direct fetch:', err);
    return fetcher();
  }
}

/**
 * Invalidate cache keys by pattern
 */
export async function invalidateCache(pattern: string): Promise<number> {
  if (!import.meta.env.VITE_REDIS_URL) return 0;
  
  try {
    const redis = await getRedisClient();
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;
    return await redis.del(...keys);
  } catch (err) {
    console.warn('Cache invalidation error:', err);
    return 0;
  }
}

/**
 * Bump version to invalidate all caches with that prefix
 */
export async function bumpCacheVersion(prefix: string): Promise<void> {
  if (!import.meta.env.VITE_REDIS_URL) return;
  
  try {
    const redis = await getRedisClient();
    await redis.incr(`version:${prefix}`);
  } catch (err) {
    console.warn('Cache version bump error:', err);
  }
}

/**
 * Get current cache version for a prefix
 */
export async function getCacheVersion(prefix: string): Promise<number> {
  if (!import.meta.env.VITE_REDIS_URL) return 0;
  
  try {
    const redis = await getRedisClient();
    const version = await redis.get(`version:${prefix}`);
    return version ? parseInt(version, 10) : 0;
  } catch {
    return 0;
  }
}

// Lazy Redis client singleton
let redisClient: any = null;

async function getRedisClient() {
  if (redisClient) return redisClient;
  
  const Redis = (await import('ioredis')).default;
  redisClient = new Redis(import.meta.env.VITE_REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  });
  
  await redisClient.connect();
  return redisClient;
}

// Log cache metrics for observability
function logCacheMetric(type: 'hit' | 'miss' | 'hit_after_wait', key: string) {
  // Fire-and-forget metrics logging
  if (typeof window !== 'undefined' && (window as any).__cacheMetrics) {
    (window as any).__cacheMetrics.push({ type, key, timestamp: Date.now() });
  }
}
