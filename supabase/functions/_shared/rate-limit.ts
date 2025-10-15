export interface RateLimitConfig {
  limit: number;
  windowSec: number;
  prefix: string;
}

export interface RateLimitResult {
  remaining: number;
  reset: number;
}

/**
 * Token bucket rate limiter using Upstash Redis.
 * Returns RateLimitResult if allowed, Response (429) if rate limited.
 */
export async function rateLimit(
  req: Request,
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult | Response> {
  const url = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

  // If Redis not configured, skip rate limiting (development mode)
  if (!url || !token) {
    console.warn('Rate limiting disabled: Redis not configured');
    return { remaining: config.limit, reset: Date.now() / 1000 + config.windowSec };
  }

  const bucketKey = `${config.prefix}:${key}`;
  const now = Math.floor(Date.now() / 1000);

  try {
    // Get current bucket state
    const resp = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pipeline: [
          ['HGETALL', bucketKey],
          ['PTTL', bucketKey]
        ]
      })
    });

    const results = await resp.json();
    const [state, ttlMs] = results;

    // Parse bucket state
    const obj: Record<string, string> = {};
    if (Array.isArray(state)) {
      for (let i = 0; i < state.length; i += 2) {
        obj[state[i]] = state[i + 1];
      }
    }

    let tokens = obj.tokens ? parseInt(obj.tokens) : config.limit;
    let reset = obj.reset ? parseInt(obj.reset) : now + config.windowSec;

    // Reset bucket if window expired
    if (now >= reset) {
      tokens = config.limit;
      reset = now + config.windowSec;
    }

    // Check if rate limited
    if (tokens <= 0) {
      const retryAfter = Math.max(1, reset - now);
      return new Response(
        JSON.stringify({ error: 'Too Many Requests' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(config.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(reset)
          }
        }
      );
    }

    // Consume token
    tokens -= 1;

    // Persist updated bucket
    await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pipeline: [
          ['HSET', bucketKey, 'tokens', String(tokens), 'reset', String(reset)],
          ['EXPIREAT', bucketKey, String(reset)]
        ]
      })
    });

    return { remaining: tokens, reset };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open - allow request if rate limiting fails
    return { remaining: config.limit, reset: now + config.windowSec };
  }
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult,
  limit: number
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', String(limit));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(result.reset));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
