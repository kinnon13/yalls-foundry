import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Rate limiting middleware with proper headers
 * Wraps endpoint handlers and enforces rate limits via check_rate_limit RPC
 */
export async function withRateLimit(
  supabase: SupabaseClient,
  scope: string,
  limit: number,
  windowSec: number,
  handler: () => Promise<Response>
): Promise<Response> {
  // Check rate limit
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_scope: scope,
    p_limit: limit,
    p_window_sec: windowSec,
  });

  if (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - don't block on rate limit errors
    return handler();
  }

  const limitInfo = data as {
    allowed: boolean;
    remaining: number;
    limit: number;
    window_sec: number;
  };

  // Add rate limit headers to response
  const addRateLimitHeaders = (response: Response): Response => {
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', limitInfo.limit.toString());
    headers.set('X-RateLimit-Remaining', limitInfo.remaining.toString());
    headers.set('X-RateLimit-Reset', (Date.now() + limitInfo.window_sec * 1000).toString());
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };

  // If not allowed, return 429
  if (!limitInfo.allowed) {
    const retryAfter = limitInfo.window_sec;
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retry_after: retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': limitInfo.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + limitInfo.window_sec * 1000).toString(),
        },
      }
    );
  }

  // Execute handler and add headers
  const response = await handler();
  return addRateLimitHeaders(response);
}

/**
 * Generate rate limit scope from request
 * Combines IP + user for better fairness
 */
export function getRateLimitScope(req: Request, prefix: string): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userId = req.headers.get('x-user-id') || 'anon';
  return `${prefix}:${ip}:${userId}`;
}
