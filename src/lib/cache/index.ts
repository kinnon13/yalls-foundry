/**
 * Standardized Cache Interface (Horizontally Scalable)
 * 
 * Simple, unified API for distributed caching via Upstash Redis.
 * Falls back to in-memory cache in development.
 * 
 * Usage:
 *   import { Cache } from '@/lib/cache';
 *   await Cache.set('categories', data, 60);
 *   const data = await Cache.get<Category[]>('categories');
 */

import { cacheProvider } from './provider';

/**
 * Simple cache interface - use this everywhere
 */
export const Cache = {
  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or null if not found/expired
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await cacheProvider.get<T>(key);
    } catch (error) {
      console.error('Cache get failed:', key, error);
      return null;
    }
  },

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache (will be JSON serialized)
   * @param ttlSec Time-to-live in seconds (default: 300 = 5min)
   */
  async set<T>(key: string, value: T, ttlSec = 300): Promise<void> {
    try {
      await cacheProvider.set(key, value, ttlSec);
    } catch (error) {
      console.error('Cache set failed:', key, error);
      // Fail silently - cache is not critical
    }
  },

  /**
   * Delete value from cache
   * @param key Cache key
   */
  async del(key: string): Promise<void> {
    try {
      await cacheProvider.delete(key);
    } catch (error) {
      console.error('Cache delete failed:', key, error);
    }
  },

  /**
   * Clear all cache entries (use sparingly)
   */
  async clear(): Promise<void> {
    try {
      await cacheProvider.clear();
    } catch (error) {
      console.error('Cache clear failed:', error);
    }
  },

  /**
   * Get or compute - returns cached value or computes and caches it
   * @param key Cache key
   * @param compute Function to compute value if not cached
   * @param ttlSec Time-to-live in seconds
   */
  async getOrCompute<T = any>(
    key: string,
    compute: () => Promise<T>,
    ttlSec = 300
  ): Promise<T> {
    const cached = await this.get(key);
    if (cached !== null) return cached as T;

    const value = await compute();
    await this.set(key, value, ttlSec);
    return value;
  },
};

/**
 * Common cache key patterns
 */
export const CacheKeys = {
  categories: () => 'marketplace:categories:all',
  categoryTree: (parentId: string | null) => `marketplace:categories:tree:${parentId || 'root'}`,
  listing: (id: string) => `marketplace:listing:${id}`,
  userProfile: (userId: string) => `profile:${userId}`,
  rateLimit: (key: string, window: number) => `ratelimit:${key}:${Math.floor(Date.now() / (window * 1000))}`,
};
