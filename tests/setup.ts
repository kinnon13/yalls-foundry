/**
 * Vitest Global Test Setup
 * 
 * Runs before all tests to configure mocks and globals.
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock Sentry globally
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: (cb: any) => cb({
    setTag: vi.fn(),
    setUser: vi.fn(),
    setContext: vi.fn(),
    setLevel: vi.fn(),
    setFingerprint: vi.fn(),
  }),
  setUser: vi.fn(),
  setTag: vi.fn(),
}));

// Mock Supabase client globally
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

// Mock crypto.randomUUID for tests
if (typeof crypto === 'undefined' || !crypto.randomUUID) {
  global.crypto = {
    randomUUID: () => '00000000-0000-0000-0000-000000000000',
  } as any;
}

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    length: Object.keys(store).length,
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

global.sessionStorage = sessionStorageMock;

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_REDIS_URL: undefined,
      VITE_SENTRY_DSN: undefined,
    },
  },
});
