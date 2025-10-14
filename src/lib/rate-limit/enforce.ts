/**
 * Rate Limit Enforcement
 * 
 * Multi-layer rate limiting:
 * - L0: In-memory burst protection (per-second)
 * - L1: Distributed per-minute limits (via cache provider)
 * - L2: Audit logging (TODO)
 * 
 * Usage:
 *   import { checkRateLimit } from '@/lib/rate-limit/enforce';
 *   const result = await checkRateLimit('api:user:123', { burst: 10, sustained: 100 });
 */

import { burstLimiter } from './memory';
import { cacheProvider } from '@/lib/cache/provider';

export interface RateLimitConfig {
  burst: number;      // requests per second
  sustained: number;  // requests per minute
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // seconds
  remaining?: number;
}

/**
 * Check rate limit with multi-layer enforcement
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // L0: Per-second burst check (fast, in-memory)
  const burstAllowed = burstLimiter.check(key, config.burst);
  if (!burstAllowed) {
    return {
      allowed: false,
      retryAfter: 1, // Try again in 1 second
    };
  }

  // L1: Per-minute sustained check (distributed)
  const minuteKey = `ratelimit:${key}:${Math.floor(Date.now() / 60000)}`;
  
  try {
    const count = await cacheProvider.get<number>(minuteKey) || 0;
    
    if (count >= config.sustained) {
      const ttl = 60 - (Math.floor(Date.now() / 1000) % 60);
      return {
        allowed: false,
        retryAfter: ttl,
      };
    }

    // Increment counter
    await cacheProvider.set(minuteKey, count + 1, 60);

    return {
      allowed: true,
      remaining: config.sustained - count - 1,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow request if rate limit check fails
    return { allowed: true };
  }
}

/**
 * Default rate limit configs by resource type
 */
export const rateLimits = {
  api: { burst: 10, sustained: 100 },        // API endpoints
  auth: { burst: 3, sustained: 10 },         // Auth attempts
  search: { burst: 5, sustained: 50 },       // Search queries
  upload: { burst: 2, sustained: 20 },       // File uploads
  mutation: { burst: 5, sustained: 60 },     // Data mutations
};

// TODO L2: Audit logging
// - Log rate limit violations to separate table
// - Enable analysis of abuse patterns
// - Trigger alerts for sustained violations