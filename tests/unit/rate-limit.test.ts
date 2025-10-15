/**
 * Rate Limit Tests
 * 
 * Verify rate limiting works correctly and blocks excessive requests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, rateLimits } from '@/lib/rate-limit/enforce';
import { Cache } from '@/lib/cache';

describe('Rate Limiting', () => {
  beforeEach(async () => {
    await Cache.clear();
  });

  it('should allow requests under limit', async () => {
    const result = await checkRateLimit('test:user:1', { burst: 10, sustained: 100 });
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it('should block requests over sustained limit', async () => {
    const config = { burst: 1000, sustained: 5 }; // Allow burst but limit sustained
    
    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      await checkRateLimit('test:user:2', config);
    }
    
    // 6th request should be blocked
    const result = await checkRateLimit('test:user:2', config);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('should have predefined rate limit configs', () => {
    expect(rateLimits.api).toBeDefined();
    expect(rateLimits.auth).toBeDefined();
    expect(rateLimits.search).toBeDefined();
    expect(rateLimits.upload).toBeDefined();
    expect(rateLimits.mutation).toBeDefined();
  });

  it('should respect burst limits', async () => {
    const config = { burst: 2, sustained: 1000 }; // Allow sustained but limit burst
    
    // First 2 requests should succeed
    const r1 = await checkRateLimit('test:user:3', config);
    const r2 = await checkRateLimit('test:user:3', config);
    
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    
    // 3rd request in same second should be blocked
    const r3 = await checkRateLimit('test:user:3', config);
    expect(r3.allowed).toBe(false);
  });
});
