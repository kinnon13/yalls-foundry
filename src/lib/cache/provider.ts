/**
 * Cache Provider Interface
 * 
 * Abstraction for L2 cache (Upstash Redis or Supabase cache table).
 * Currently uses in-memory L1; extend here for distributed caching.
 * 
 * Usage:
 *   import { cacheProvider } from '@/lib/cache/provider';
 *   await cacheProvider.get('key');
 */

import { memCache } from './memory';
import { config } from '@/lib/config';

interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Upstash Redis provider (when enabled)
 * Requires VITE_USE_UPSTASH=true and credentials
 */
class UpstashProvider implements CacheProvider {
  private baseUrl: string;
  private token: string;

  constructor(url: string, token: string) {
    this.baseUrl = url;
    this.token = token;
  }

  async get<T>(key: string): Promise<T | null> {
    const response = await fetch(`${this.baseUrl}/get/${key}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    const data = await response.json();
    return data.result ? JSON.parse(data.result) : null;
  }

  async set<T>(key: string, value: T, ttl = 300): Promise<void> {
    await fetch(`${this.baseUrl}/set/${key}`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: JSON.stringify(value), ex: ttl }),
    });
  }

  async delete(key: string): Promise<void> {
    await fetch(`${this.baseUrl}/del/${key}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.token}` },
    });
  }

  async clear(): Promise<void> {
    // Upstash doesn't support flushall via REST API
    console.warn('Upstash clear() not implemented via REST API');
  }
}

/**
 * Memory-only provider (default)
 */
class MemoryProvider implements CacheProvider {
  async get<T>(key: string): Promise<T | null> {
    return memCache.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl = 300): Promise<void> {
    await memCache.set(key, value, { ttl });
  }

  async delete(key: string): Promise<void> {
    await memCache.delete(key);
  }

  async clear(): Promise<void> {
    await memCache.clear();
  }
}

// Select provider based on config
function createCacheProvider(): CacheProvider {
  if (config.VITE_USE_UPSTASH && config.VITE_UPSTASH_REDIS_REST_URL && config.VITE_UPSTASH_REDIS_REST_TOKEN) {
    return new UpstashProvider(config.VITE_UPSTASH_REDIS_REST_URL, config.VITE_UPSTASH_REDIS_REST_TOKEN);
  }
  return new MemoryProvider();
}

export const cacheProvider = createCacheProvider();