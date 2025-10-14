/**
 * Unit Tests: Feature Flags
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getFlag, setFlag, listFlags, resetFlags } from '@/lib/featureFlags';

describe('featureFlags', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      clear: () => { store = {}; },
    };
  })();

  beforeEach(() => {
    // Reset localStorage before each test
    localStorageMock.clear();
    Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });
  });

  it('should return default value for unknown flag', () => {
    expect(getFlag('unknown_flag', true)).toBe(true);
    expect(getFlag('unknown_flag', false)).toBe(false);
  });

  it('should return default flags on first load', () => {
    const flags = listFlags();
    expect(flags.feed).toBe(true);
    expect(flags.market).toBe(true);
    expect(flags.events).toBe(true);
    expect(flags.ai).toBe(true);
  });

  it('should persist flag changes to localStorage', () => {
    setFlag('feed', false);
    expect(getFlag('feed')).toBe(false);
    
    // Verify it's in localStorage
    const stored = localStorageMock.getItem('yalls_feature_flags');
    expect(stored).toContain('"feed":false');
  });

  it('should list all flags including custom ones', () => {
    setFlag('custom_feature', true);
    const flags = listFlags();
    expect(flags.custom_feature).toBe(true);
  });

  it('should reset flags to defaults', () => {
    setFlag('feed', false);
    setFlag('market', false);
    resetFlags();
    
    const flags = listFlags();
    expect(flags.feed).toBe(true);
    expect(flags.market).toBe(true);
  });
});
