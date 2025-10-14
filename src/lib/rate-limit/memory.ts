/**
 * L0 In-Memory Rate Limiter
 * 
 * Fast in-process burst protection using token bucket algorithm.
 * Per-second burst limiting before falling back to L1 Redis.
 * 
 * Usage:
 *   import { burstLimiter } from '@/lib/rate-limit/memory';
 *   const allowed = burstLimiter.check('user:123', 10); // 10 req/sec
 */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

class BurstLimiter {
  private buckets = new Map<string, TokenBucket>();

  check(key: string, limit: number): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: limit, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    // Refill tokens based on time passed (1 token per second)
    const secondsPassed = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(limit, bucket.tokens + secondsPassed);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    const ttl = 60000; // 1 minute
    
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > ttl) {
        this.buckets.delete(key);
      }
    }
  }
}

export const burstLimiter = new BurstLimiter();

// Cleanup old buckets every minute
if (typeof window !== 'undefined') {
  setInterval(() => burstLimiter.cleanup(), 60000);
}