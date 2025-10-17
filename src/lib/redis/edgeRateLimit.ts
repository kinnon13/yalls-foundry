/**
 * Task 3: Edge Rate Limiting (Token Bucket)
 * Redis-backed burst protection at edge
 * Sheds load BEFORE hitting database
 */

import { redis } from './client';

interface TokenBucketConfig {
  burst: number;      // Max tokens (burst capacity)
  refillRate: number; // Tokens per second
  window: number;     // Window in seconds
}

export const RateLimitProfiles = {
  rpc_default: { burst: 30, refillRate: 2, window: 60 },
  rpc_feed: { burst: 20, refillRate: 1.5, window: 60 },
  rpc_notify: { burst: 10, refillRate: 0.5, window: 60 },
  auth: { burst: 5, refillRate: 0.2, window: 60 },
} as const;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit using token bucket algorithm
 * @param key - Unique identifier (user_id, ip, etc.)
 * @param config - Bucket configuration
 */
export async function checkEdgeRateLimit(
  key: string,
  config: TokenBucketConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const bucketKey = `edge_rl:${key}`;
  
  try {
    // Use Redis pipeline for atomic operation
    const result = await redis.eval(
      `
      local key = KEYS[1]
      local burst = tonumber(ARGV[1])
      local rate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local window = tonumber(ARGV[4])
      
      local bucket = redis.call('HMGET', key, 'tokens', 'last')
      local tokens = tonumber(bucket[1]) or burst
      local last = tonumber(bucket[2]) or now
      
      -- Refill tokens based on time passed
      local elapsed = (now - last) / 1000
      tokens = math.min(burst, tokens + (elapsed * rate))
      
      local allowed = 0
      if tokens >= 1 then
        tokens = tokens - 1
        allowed = 1
      end
      
      -- Update bucket
      redis.call('HMSET', key, 'tokens', tokens, 'last', now)
      redis.call('EXPIRE', key, window)
      
      return {allowed, math.floor(tokens), now + ((burst - tokens) / rate * 1000)}
      `,
      1,
      bucketKey,
      config.burst.toString(),
      config.refillRate.toString(),
      now.toString(),
      config.window.toString()
    );
    
    const [allowed, remaining, resetAt] = result as [number, number, number];
    
    return {
      allowed: allowed === 1,
      remaining,
      resetAt,
    };
  } catch (err) {
    console.error('[EdgeRateLimit] Redis error:', err);
    // Fail open if Redis is down
    return { allowed: true, remaining: config.burst, resetAt: now + config.window * 1000 };
  }
}

/**
 * Middleware factory for edge functions
 */
export function createRateLimitMiddleware(profile: keyof typeof RateLimitProfiles) {
  const config = RateLimitProfiles[profile];
  
  return async (req: Request, identifier: string): Promise<Response | null> => {
    const result = await checkEdgeRateLimit(identifier, config);
    
    if (!result.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': config.burst.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetAt.toString(),
          },
        }
      );
    }
    
    return null; // Allowed, continue
  };
}
