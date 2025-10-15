/**
 * Redis-based Rate Limiting
 * Uses sliding window for accurate rate limiting
 */

export interface RateLimitConfig {
  key: string;
  limit: number;
  window: number; // seconds
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit using Redis sliding window
 * This should be called from Edge Functions with Upstash Redis
 */
export async function checkRateLimit(
  config: RateLimitConfig,
  redisUrl: string,
  redisToken: string
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - config.window * 1000;

  try {
    // Using REST API approach for Deno compatibility
    const commands = [
      ['ZREMRANGEBYSCORE', config.key, 0, windowStart],
      ['ZADD', config.key, now, `${now}-${Math.random()}`],
      ['ZCARD', config.key],
      ['EXPIRE', config.key, config.window]
    ];

    const response = await fetch(`${redisUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      console.error('Redis error:', await response.text());
      // Fail open - allow request if Redis is down
      return { success: true, remaining: config.limit, reset: now + config.window * 1000 };
    }

    const results = await response.json();
    const count = results[2]?.result || 0;

    const remaining = Math.max(0, config.limit - count);
    const success = count <= config.limit;

    return {
      success,
      remaining,
      reset: now + config.window * 1000,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open
    return { success: true, remaining: config.limit, reset: now + config.window * 1000 };
  }
}

/**
 * Rate limit middleware for Edge Functions
 */
export function createRateLimitMiddleware(config: {
  limit: number;
  window: number;
  keyPrefix: string;
}) {
  return async (
    req: Request,
    identifier: string,
    getEnv: (key: string) => string | undefined = (key) => undefined
  ): Promise<Response | null> => {
    const redisUrl = getEnv('UPSTASH_REDIS_URL');
    const redisToken = getEnv('UPSTASH_REDIS_TOKEN');

    if (!redisUrl || !redisToken) {
      console.warn('Redis credentials not configured, rate limiting disabled');
      return null;
    }

    const result = await checkRateLimit(
      {
        key: `${config.keyPrefix}:${identifier}`,
        limit: config.limit,
        window: config.window,
      },
      redisUrl,
      redisToken
    );

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          remaining: result.remaining,
          reset: result.reset,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': config.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return null; // Allow request to proceed
  };
}
