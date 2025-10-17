/**
 * Redis Client (Task 3)
 * Thin wrapper around Redis for rate limiting and caching
 */

interface RedisClient {
  eval(script: string, numKeys: number, ...args: string[]): Promise<any>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ex?: number): Promise<void>;
  del(key: string): Promise<void>;
}

class MockRedis implements RedisClient {
  private store = new Map<string, { value: string; expiry?: number }>();
  
  async eval(script: string, numKeys: number, ...args: string[]): Promise<any> {
    // Mock token bucket for local dev
    return [1, 100, Date.now() + 60000];
  }
  
  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiry && entry.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }
  
  async set(key: string, value: string, ex?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiry: ex ? Date.now() + ex * 1000 : undefined,
    });
  }
  
  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

// Use mock for now; swap for real Redis in production
export const redis: RedisClient = new MockRedis();
