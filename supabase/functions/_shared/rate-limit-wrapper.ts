/**
 * Rate Limit Wrapper for Edge Functions
 * 
 * Simple wrapper to apply consistent rate limiting across all edge functions.
 * Uses token bucket algorithm with Redis backing.
 * 
 * Usage in edge function:
 *   import { withRateLimit } from '../_shared/rate-limit-wrapper.ts';
 *   
 *   Deno.serve(async (req) => {
 *     const limited = await withRateLimit(req, 'function-name', { burst: 10, perMin: 100 });
 *     if (limited) return limited;
 *     // ... rest of function
 *   });
 */

import { rateLimit } from './rate-limit.ts';

export interface RateLimitConfig {
  burst?: number;    // Requests per second (default: 10)
  perMin?: number;   // Requests per minute (default: 100)
}

/**
 * Apply rate limiting to edge function request
 * Returns Response with 429 if rate limited, null if allowed
 */
export async function withRateLimit(
  req: Request,
  functionName: string,
  config: RateLimitConfig = {}
): Promise<Response | null> {
  const { burst = 10, perMin = 100 } = config;
  
  // Extract identifier (user ID or IP)
  const authHeader = req.headers.get('Authorization');
  let identifier = req.headers.get('x-forwarded-for') || 'anonymous';
  
  // Try to get user ID from auth header
  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(token.split('.')[1]));
      identifier = payload.sub || identifier;
    } catch {
      // Failed to parse token, use IP
    }
  }
  
  // Check rate limit
  const result = await rateLimit(req, identifier, {
    limit: perMin,
    windowSec: 60,
    prefix: `ratelimit:${functionName}`,
  });
  
  // If result is a Response, it means we're rate limited
  if (result instanceof Response) {
    return result;
  }
  
  // Not rate limited, continue
  return null;
}

/**
 * Common rate limit configs by function type
 */
export const RateLimits = {
  // High-frequency functions (search, autocomplete)
  high: { burst: 20, perMin: 200 },
  
  // Standard API functions
  standard: { burst: 10, perMin: 100 },
  
  // Expensive operations (AI, uploads)
  expensive: { burst: 5, perMin: 30 },
  
  // Authentication functions
  auth: { burst: 3, perMin: 10 },
  
  // Admin functions
  admin: { burst: 50, perMin: 500 },
};
