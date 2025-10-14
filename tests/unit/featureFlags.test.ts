/**
 * Unit Tests: Feature Flags
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getFlag, setFlag, allFlags } from '@/lib/flags';

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

  it('should return env default for known flag', () => {
    expect(getFlag('feedback')).toBe(true); // env default
    expect(getFlag('ai')).toBe(true);
  });

  it('should return default flags on first load', () => {
    const flags = allFlags();
    expect(flags.feed).toBe(true);
    expect(flags.market).toBe(true);
    expect(flags.events).toBe(true);
    expect(flags.ai).toBe(true);
    expect(flags.feedback).toBe(true);
  });

  it('should persist flag changes to localStorage', () => {
    setFlag('feed', false);
    expect(getFlag('feed')).toBe(false);
    
    // Verify it's in localStorage
    const stored = localStorageMock.getItem('yalls_flags');
    expect(stored).toContain('"feed":false');
  });

  it('should list all known flags', () => {
    const flags = allFlags();
    expect(flags.feedback).toBeDefined();
    expect(flags.ai).toBeDefined();
    expect(flags.feed).toBeDefined();
  });

  it('should allow overriding env defaults', () => {
    setFlag('feed', false);
    setFlag('market', false);
    
    expect(getFlag('feed')).toBe(false);
    expect(getFlag('market')).toBe(false);
  });
});
