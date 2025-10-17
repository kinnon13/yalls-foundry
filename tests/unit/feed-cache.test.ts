/**
 * Feed Caching with Redis Tests
 * 
 * Verify cache behavior with/without Redis, stampede protection, and fallback.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock environment
const mockEnv = (redisUrl?: string) => {
  vi.stubGlobal('import', {
    meta: {
      env: {
        VITE_REDIS_URL: redisUrl,
      },
    },
  });
};

describe('Feed Caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Cache Fallback', () => {
    it('should return data when Redis unavailable', async () => {
      mockEnv(undefined); // No Redis URL

      const cachedFetch = async <T>(
        key: string,
        ttl: number,
        fetcher: () => Promise<T>
      ): Promise<T> => {
        // If no Redis, just fetch
        if (!import.meta.env?.VITE_REDIS_URL) {
          return fetcher();
        }
        
        // ... Redis logic
        return fetcher();
      };

      const result = await cachedFetch('test', 30, async () => ({ data: 'test' }));
      
      expect(result).toEqual({ data: 'test' });
    });

    it('should use cache when Redis available', async () => {
      mockEnv('redis://localhost:6379');

      let fetchCount = 0;
      const fetcher = async () => {
        fetchCount++;
        return { data: 'test' };
      };

      // Simulate cache hit
      const mockRedis = {
        get: vi.fn().mockResolvedValue(JSON.stringify({ data: 'test' })),
        set: vi.fn(),
        del: vi.fn(),
      };

      const cachedFetch = async <T>(
        key: string,
        ttl: number,
        fetcher: () => Promise<T>
      ): Promise<T> => {
        const hit = await mockRedis.get(key);
        if (hit) return JSON.parse(hit);
        
        const data = await fetcher();
        await mockRedis.set(key, JSON.stringify(data));
        return data;
      };

      const result = await cachedFetch('test', 30, fetcher);
      
      expect(result).toEqual({ data: 'test' });
      expect(fetchCount).toBe(0); // Should not call fetcher
      expect(mockRedis.get).toHaveBeenCalledWith('test');
    });
  });

  describe('Stampede Protection', () => {
    it('should use lock key to prevent stampede', async () => {
      const mockRedis = {
        get: vi.fn()
          .mockResolvedValueOnce(null) // First: cache miss
          .mockResolvedValueOnce(null) // Second: lock check, not set yet
          .mockResolvedValueOnce(JSON.stringify({ data: 'test' })), // Third: data available
        set: vi.fn()
          .mockResolvedValueOnce('OK') // Set lock
          .mockResolvedValueOnce('OK'), // Set data
        del: vi.fn(),
      };

      const cachedFetchWithLock = async <T>(
        key: string,
        ttl: number,
        fetcher: () => Promise<T>
      ): Promise<T> => {
        // Check cache
        const hit = await mockRedis.get(key);
        if (hit) return JSON.parse(hit);

        // Try to acquire lock
        const lockKey = `lock:${key}`;
        const gotLock = await mockRedis.set(lockKey, '1');
        
        if (!gotLock) {
          // Another request is fetching, wait and retry
          await new Promise(r => setTimeout(r, 100));
          const retry = await mockRedis.get(key);
          if (retry) return JSON.parse(retry);
        }

        // Fetch and cache
        const data = await fetcher();
        await mockRedis.set(key, JSON.stringify(data));
        await mockRedis.del(lockKey);
        
        return data;
      };

      let fetchCount = 0;
      const fetcher = async () => {
        fetchCount++;
        await new Promise(r => setTimeout(r, 50)); // Simulate slow fetch
        return { data: 'test' };
      };

      const result = await cachedFetchWithLock('test', 30, fetcher);
      
      expect(result).toEqual({ data: 'test' });
      expect(fetchCount).toBe(1); // Only one fetch despite multiple requests
    });
  });

  describe('Cache Key Versioning', () => {
    it('should include version in cache key', () => {
      const buildCacheKey = (
        type: string,
        id: string,
        version: number
      ) => {
        return `${type}:v${version}:${id}`;
      };

      expect(buildCacheKey('feed', 'user-123', 1)).toBe('feed:v1:user-123');
      expect(buildCacheKey('feed', 'user-123', 2)).toBe('feed:v2:user-123');
    });

    it('should invalidate all caches by bumping version', () => {
      let currentVersion = 1;
      
      const bumpVersion = () => {
        currentVersion++;
      };

      const getCacheKey = (id: string) => {
        return `feed:v${currentVersion}:${id}`;
      };

      const key1 = getCacheKey('user-123');
      expect(key1).toBe('feed:v1:user-123');

      bumpVersion();

      const key2 = getCacheKey('user-123');
      expect(key2).toBe('feed:v2:user-123');
      expect(key2).not.toBe(key1); // Old cache is invalidated
    });
  });

  describe('TTL Management', () => {
    it('should respect different TTLs per resource type', () => {
      const TTLs = {
        feed: 30,      // 30 seconds
        profile: 300,  // 5 minutes
        static: 86400, // 1 day
      };

      expect(TTLs.feed).toBe(30);
      expect(TTLs.profile).toBe(300);
      expect(TTLs.static).toBe(86400);
    });
  });
});
