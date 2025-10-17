/**
 * Redis Client Wrapper
 * Production-grade connection pooling and error handling
 */

import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;

export const redis = {
  async get(): Promise<RedisClientType> {
    if (!client) {
      const url = import.meta.env.VITE_REDIS_URL;
      if (!url) {
        console.warn('[Redis] VITE_REDIS_URL not set, operations will fail gracefully');
        throw new Error('Redis not configured');
      }

      client = createClient({ url });
      
      client.on('error', (err) => {
        console.error('[Redis] Connection error:', err);
      });

      client.on('reconnecting', () => {
        console.log('[Redis] Reconnecting...');
      });

      await client.connect();
      console.log('[Redis] Connected successfully');
    }
    return client;
  },

  async quit() {
    if (client) {
      await client.quit();
      client = null;
    }
  },

  /**
   * Safe get with fallback
   */
  async safeGet<T>(key: string, fallback: T): Promise<T> {
    try {
      const c = await this.get();
      const value = await c.get(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },

  /**
   * Safe set with TTL
   */
  async safeSet(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
    try {
      const c = await this.get();
      await c.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      console.error('[Redis] Set failed:', err);
    }
  }
};
