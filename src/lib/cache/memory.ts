/**
 * L1 In-Memory Cache (Legacy - Single Instance Only)
 * 
 * ⚠️ WARNING: Not horizontally scalable - use cacheProvider for production
 * This cache is per-process and does NOT sync across multiple instances.
 * 
 * For horizontally scalable caching, use:
 *   import { cacheProvider } from '@/lib/cache/provider';
 * 
 * Usage (single-instance only):
 *   import { memCache } from '@/lib/cache/memory';
 *   await memCache.set('key', value, { ttl: 60 });
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

interface CacheOptions {
  ttl?: number; // seconds
  tags?: string[];
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private tagIndex = new Map<string, Set<string>>(); // tag -> keys

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }
    
    return entry.value as T;
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const { ttl = 300, tags = [] } = options; // default 5min
    
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttl * 1000,
      tags,
    };
    
    this.cache.set(key, entry);
    
    // Index by tags
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  async delete(key: string): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      // Remove from tag index
      for (const tag of entry.tags) {
        this.tagIndex.get(tag)?.delete(key);
      }
    }
    this.cache.delete(key);
  }

  async invalidateByTag(tag: string): Promise<void> {
    const keys = this.tagIndex.get(tag);
    if (keys) {
      for (const key of keys) {
        this.cache.delete(key);
      }
      this.tagIndex.delete(tag);
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.tagIndex.clear();
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key);
      }
    }
  }
}

export const memCache = new MemoryCache();

// Run cleanup every 60 seconds
if (typeof window !== 'undefined') {
  setInterval(() => memCache.cleanup(), 60000);
}

// Migration helper: Use distributed cache for horizontal scalability
export { cacheProvider as distributedCache } from './provider';