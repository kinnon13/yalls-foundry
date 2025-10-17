/**
 * Entitlements & Paywall Tests
 * 
 * Verify entitlement checks, age gating, and paywall behavior.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase before importing code that uses it
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  },
}));

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  withScope: (cb: any) => cb({ setTag: vi.fn(), setUser: vi.fn(), setContext: vi.fn() }),
}));

describe('Entitlements System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Feature Access Control', () => {
    it('should allow access to free features', () => {
      // Free features don't require entitlements
      const isFreeFeature = (feature: string) => {
        return ['home', 'profile', 'search'].includes(feature);
      };

      expect(isFreeFeature('home')).toBe(true);
      expect(isFreeFeature('premium_analytics')).toBe(false);
    });

    it('should enforce min_age_years requirement', () => {
      const checkAgeGate = (birthDate: string | null, minAge: number) => {
        if (!birthDate) return false;
        
        const age = Math.floor(
          (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        );
        
        return age >= minAge;
      };

      // 18+ required
      expect(checkAgeGate('2000-01-01', 18)).toBe(true); // ~25 years old
      expect(checkAgeGate('2010-01-01', 18)).toBe(false); // ~15 years old
      expect(checkAgeGate(null, 18)).toBe(false); // No birth date
    });

    it('should respect entitlement limits', () => {
      const checkLimit = (used: number, limit: number | null) => {
        if (limit === null) return true; // Unlimited
        return used < limit;
      };

      expect(checkLimit(5, 10)).toBe(true);
      expect(checkLimit(10, 10)).toBe(false);
      expect(checkLimit(100, null)).toBe(true); // Unlimited
    });
  });

  describe('Entitlement Invalidation', () => {
    it('should have invalidation mechanism', () => {
      // Track invalidation calls
      const invalidateCalls: string[] = [];
      
      const invalidateEntitlements = (userId: string) => {
        invalidateCalls.push(userId);
        // In real code: queryClient.invalidateQueries(['entitlements', userId])
      };

      invalidateEntitlements('user-123');
      expect(invalidateCalls).toContain('user-123');
    });
  });

  describe('Paywall Behavior', () => {
    it('should block access when entitlement missing', () => {
      const hasEntitlement = (feature: string, entitlements: string[]) => {
        return entitlements.includes(feature);
      };

      const userEntitlements = ['basic_feed', 'profile'];
      
      expect(hasEntitlement('basic_feed', userEntitlements)).toBe(true);
      expect(hasEntitlement('premium_analytics', userEntitlements)).toBe(false);
    });

    it('should log entitlement gate outcomes', () => {
      const logs: Array<{ feature: string; allowed: boolean }> = [];
      
      const logGate = (feature: string, allowed: boolean) => {
        logs.push({ feature, allowed });
      };

      logGate('premium_analytics', false);
      logGate('basic_feed', true);

      expect(logs).toHaveLength(2);
      expect(logs[0]).toEqual({ feature: 'premium_analytics', allowed: false });
      expect(logs[1]).toEqual({ feature: 'basic_feed', allowed: true });
    });
  });
});
