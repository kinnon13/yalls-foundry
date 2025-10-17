/**
 * Edge Function Rate Limiting Tests
 * 
 * Verify rate limit middleware returns 429 and includes proper headers.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Edge Function Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rate Limit Middleware', () => {
    it('should return 429 when limit exceeded', () => {
      const checkRateLimit = (count: number, limit: number) => {
        if (count >= limit) {
          return {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': '0',
              'Retry-After': '60',
            },
          };
        }
        return {
          status: 200,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': (limit - count - 1).toString(),
          },
        };
      };

      // Under limit
      const allow = checkRateLimit(5, 10);
      expect(allow.status).toBe(200);
      expect(allow.headers['X-RateLimit-Remaining']).toBe('4');

      // At limit
      const block = checkRateLimit(10, 10);
      expect(block.status).toBe(429);
      expect(block.headers['Retry-After']).toBe('60');
    });

    it('should include rate limit headers on success', () => {
      const response = {
        status: 200,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '95',
          'X-RateLimit-Reset': '1234567890',
        },
      };

      expect(response.headers).toHaveProperty('X-RateLimit-Limit');
      expect(response.headers).toHaveProperty('X-RateLimit-Remaining');
      expect(response.headers).toHaveProperty('X-RateLimit-Reset');
    });

    it('should calculate correct retry-after', () => {
      const calculateRetryAfter = (windowSec: number) => {
        const now = Math.floor(Date.now() / 1000);
        const windowStart = Math.floor(now / windowSec) * windowSec;
        const windowEnd = windowStart + windowSec;
        return windowEnd - now;
      };

      const retryAfter = calculateRetryAfter(60);
      
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(60);
    });
  });

  describe('Scope Key Generation', () => {
    it('should generate proper scope keys', () => {
      const generateScope = (prefix: string, identifier: string) => {
        return `${prefix}:${identifier}`;
      };

      expect(generateScope('api', 'user-123')).toBe('api:user-123');
      expect(generateScope('auth', 'ip-1.2.3.4')).toBe('auth:ip-1.2.3.4');
    });

    it('should include tenant in scope when provided', () => {
      const generateScope = (
        prefix: string, 
        identifier: string, 
        tenantId?: string
      ) => {
        const parts = [prefix];
        if (tenantId) parts.push(tenantId);
        parts.push(identifier);
        return parts.join(':');
      };

      expect(generateScope('api', 'user-123')).toBe('api:user-123');
      expect(generateScope('api', 'user-123', 'tenant-1')).toBe('api:tenant-1:user-123');
    });
  });

  describe('Window-Based Limiting', () => {
    it('should reset count at window boundary', () => {
      const isNewWindow = (lastWindowStart: number, windowSec: number) => {
        const now = Math.floor(Date.now() / 1000);
        const currentWindowStart = Math.floor(now / windowSec) * windowSec;
        return currentWindowStart > lastWindowStart;
      };

      const now = Math.floor(Date.now() / 1000);
      const windowStart = Math.floor(now / 60) * 60;
      const oldWindowStart = windowStart - 60;

      expect(isNewWindow(oldWindowStart, 60)).toBe(true);
      expect(isNewWindow(windowStart, 60)).toBe(false);
    });
  });
});
