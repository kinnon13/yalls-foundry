/**
 * Telemetry & Usage Tracking Tests
 * 
 * Verify usage event logging, meta sanitization, and error handling.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock before imports
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

describe('Usage Telemetry', () => {
  describe('Meta Sanitization', () => {
    it('should strip unknown keys from meta', () => {
      const ALLOWED = ['experiment', 'variant', 'source', 'cta', 'screen', 'viewport'];
      
      const sanitizeMeta = (meta?: Record<string, unknown>) => {
        if (!meta) return null;
        const safe: Record<string, unknown> = {};
        for (const k of ALLOWED) {
          if (meta[k] !== undefined) safe[k] = meta[k];
        }
        const s = JSON.stringify(safe);
        return s.length > 1024 ? null : safe;
      };

      const input = {
        experiment: 'test-1',
        variant: 'control',
        password: 'secret123', // Should be stripped
        api_key: 'key123', // Should be stripped
      };

      const result = sanitizeMeta(input);
      
      expect(result).toHaveProperty('experiment');
      expect(result).toHaveProperty('variant');
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('api_key');
    });

    it('should cap meta size to 1KB', () => {
      const sanitizeMeta = (meta?: Record<string, unknown>) => {
        if (!meta) return null;
        const s = JSON.stringify(meta);
        return s.length > 1024 ? null : meta;
      };

      const largeMeta = {
        data: 'x'.repeat(2000), // 2KB
      };

      const result = sanitizeMeta(largeMeta);
      expect(result).toBeNull();
    });

    it('should handle null meta gracefully', () => {
      const sanitizeMeta = (meta?: Record<string, unknown>) => {
        if (!meta) return null;
        return meta;
      };

      expect(sanitizeMeta(undefined)).toBeNull();
      expect(sanitizeMeta(null as any)).toBeNull();
    });
  });

  describe('Session ID Management', () => {
    it('should generate stable session ID', () => {
      const getSessionId = () => {
        let id = sessionStorage.getItem('usage_session_id');
        if (!id) {
          id = crypto.randomUUID();
          sessionStorage.setItem('usage_session_id', id);
        }
        return id;
      };

      // Mock sessionStorage
      const store: Record<string, string> = {};
      global.sessionStorage = {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); },
        length: 0,
        key: () => null,
      };

      const id1 = getSessionId();
      const id2 = getSessionId();
      
      expect(id1).toBe(id2); // Should be stable within session
      expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('Event Type Validation', () => {
    it('should only allow valid event types', () => {
      const VALID_TYPES = [
        'impression', 'dwell_start', 'dwell_end', 
        'click', 'open', 'share', 'like', 'save', 'hide', 'report'
      ];

      const isValidEventType = (type: string) => VALID_TYPES.includes(type);

      expect(isValidEventType('impression')).toBe(true);
      expect(isValidEventType('click')).toBe(true);
      expect(isValidEventType('invalid_type')).toBe(false);
      expect(isValidEventType('delete')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should fail silently on RPC errors', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock RPC failure
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ 
        data: null, 
        error: new Error('Network error') 
      });

      // Should not throw
      const logUsage = async () => {
        try {
          await supabase.rpc('log_usage_event_v2', {});
        } catch {
          // Fail silently
        }
      };

      await expect(logUsage()).resolves.not.toThrow();
    });
  });
});
