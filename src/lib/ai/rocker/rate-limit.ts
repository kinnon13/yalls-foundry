/**
 * Rate Limiting for Rocker Actions
 * Prevents accidental loops and abuse
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

/**
 * Check if an action is rate limited
 * @param key - Unique key for the action (e.g., 'voice_post:userId')
 * @param maxAttempts - Maximum attempts allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimits.get(key);
  
  // Clean expired entry
  if (entry && entry.resetAt < now) {
    rateLimits.delete(key);
  }
  
  const current = rateLimits.get(key);
  
  if (!current) {
    // First attempt
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs };
  }
  
  if (current.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }
  
  // Increment count
  current.count++;
  return { 
    allowed: true, 
    remaining: maxAttempts - current.count, 
    resetAt: current.resetAt 
  };
}

/**
 * Reset rate limit for a specific key
 */
export function resetRateLimit(key: string): void {
  rateLimits.delete(key);
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimits.entries()) {
    if (entry.resetAt < now) {
      rateLimits.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
