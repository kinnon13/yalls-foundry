/**
 * Test Utilities - Provider-Safe Rendering
 * 
 * Wraps all components with required providers to prevent hook errors.
 */

import { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';

/**
 * Render component with all required providers
 * Prevents "Invalid hook call" errors in tests
 */
export function renderWithProviders(
  ui: ReactNode,
  opts: { route?: string; queryClient?: QueryClient } = {}
) {
  const qc = opts.queryClient || new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  if (opts.route) {
    window.history.pushState({}, '', opts.route);
  }

  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <TooltipProvider delayDuration={200}>
            {ui}
          </TooltipProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

/**
 * Mock Sentry for tests (prevents noise)
 */
export const mockSentry = () => {
  const noop = () => {};
  const mockScope = {
    setTag: noop,
    setUser: noop,
    setContext: noop,
    setLevel: noop,
    setFingerprint: noop,
  };

  return {
    init: noop,
    captureException: noop,
    captureMessage: noop,
    withScope: (cb: (scope: typeof mockScope) => void) => cb(mockScope),
    setUser: noop,
    setTag: noop,
  };
};

/**
 * Mock Supabase client for tests
 */
export const mockSupabase = () => ({
  rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
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
});
