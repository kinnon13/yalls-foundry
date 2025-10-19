/**
 * Feature Store Client (Redis-backed in production)
 * 
 * Provides fast (<5ms) access to user/item features for ranking and personalization.
 * In development, this is a simple in-memory cache. In production, use Redis.
 */

export interface UserFeatures {
  top_interests: Array<{ id: string; affinity: number }>;
  emb?: number[];
  follows_ct?: number;
  watch_time_7d?: number;
  ctr_7d?: number;
}

export interface ItemFeatures {
  tags?: string[];
  emb?: number[];
  price_norm?: number;
  engagement?: {
    ctr?: number;
    like_rate?: number;
  };
}

/**
 * Add TTL jitter (±10%) to prevent thundering herd on cache expiry
 */
function jitterSeconds(base: number, pct = 0.1): number {
  const delta = Math.floor(base * pct);
  const j = Math.floor(Math.random() * (2 * delta + 1)) - delta;
  return Math.max(1, base + j);
}

// In-memory cache for development (replace with Redis in production)
const cache = new Map<string, { data: any; expires: number }>();

/**
 * Get user features (from cache or backend)
 * @param userId - User ID
 * @returns User features or null
 */
export async function getUserFeatures(
  userId: string
): Promise<UserFeatures | null> {
  const key = `feat:user:${userId}:v1`;
  const cached = cache.get(key);

  if (cached && cached.expires > Date.now()) {
    return cached.data as UserFeatures;
  }

  // In production, fetch from Redis:
  // const redis = getRedisClient();
  // const raw = await redis.get(key);
  // return raw ? JSON.parse(raw) : null;

  // For now, return null (features should be hydrated on login)
  return null;
}

/**
 * Set user features (write to cache)
 * @param userId - User ID
 * @param features - Feature object
 * @param ttlSeconds - Time to live (default 1 hour with jitter)
 */
export function setUserFeatures(
  userId: string,
  features: UserFeatures,
  ttlSeconds = 3600
): void {
  const key = `feat:user:${userId}:v1`;
  const jitteredTtl = jitterSeconds(ttlSeconds);
  
  cache.set(key, {
    data: features,
    expires: Date.now() + jitteredTtl * 1000,
  });

  // In production, write to Redis with jitter:
  // const redis = getRedisClient();
  // await redis.set(key, JSON.stringify(features), { EX: jitteredTtl });
}

/**
 * Get item features (from cache or backend)
 * @param itemId - Item ID (post, product, etc.)
 * @returns Item features or null
 */
export async function getItemFeatures(
  itemId: string
): Promise<ItemFeatures | null> {
  const key = `feat:item:${itemId}:v1`;
  const cached = cache.get(key);

  if (cached && cached.expires > Date.now()) {
    return cached.data as ItemFeatures;
  }

  return null;
}

/**
 * Set item features (write to cache)
 * @param itemId - Item ID
 * @param features - Feature object
 * @param ttlSeconds - Time to live (default 1 hour with jitter)
 */
export function setItemFeatures(
  itemId: string,
  features: ItemFeatures,
  ttlSeconds = 3600
): void {
  const key = `feat:item:${itemId}:v1`;
  const jitteredTtl = jitterSeconds(ttlSeconds);
  
  cache.set(key, {
    data: features,
    expires: Date.now() + jitteredTtl * 1000,
  });

  // In production, write to Redis with jitter:
  // const redis = getRedisClient();
  // await redis.set(key, JSON.stringify(features), { EX: jitteredTtl });
}

/**
 * Clear all cached features (useful for testing)
 */
export function clearFeatureCache(): void {
  cache.clear();
}
