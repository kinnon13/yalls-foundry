/**
 * Rate Limiting for Edge Functions
 * Billion-user ready with stateless token bucket
 */

interface RateLimitResult {
  ok: boolean;
  retryAfter?: number;
  remaining?: number;
}

// In-memory store per isolate (stateless, best-effort)
const buckets = new Map<string, { windowStart: number; count: number }>();

export async function rateLimit(
  req: Request,
  key: string,
  limit = 60,
  windowSec = 60
): Promise<RateLimitResult> {
  const id = req.headers.get('x-forwarded-for') || 
             req.headers.get('cf-connecting-ip') || 
             'anon';
  
  const bucketKey = `${key}:${id}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSec);

  const current = buckets.get(bucketKey);

  // Clean old windows periodically
  if (Math.random() < 0.01) {
    for (const [k, v] of buckets.entries()) {
      if (v.windowStart < windowStart - windowSec) {
        buckets.delete(k);
      }
    }
  }

  if (!current || current.windowStart !== windowStart) {
    buckets.set(bucketKey, { windowStart, count: 1 });
    return { ok: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      retryAfter: (windowStart + windowSec) - now,
      remaining: 0,
    };
  }

  current.count += 1;
  return { ok: true, remaining: limit - current.count };
}
