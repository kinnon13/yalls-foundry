/**
 * Sentry Error Tracking
 * Client-side monitoring with session replay
 */

import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!DSN) {
    console.warn('[Sentry] DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_COMMIT_SHA || 'development',
  });

  console.log('[Sentry] Initialized successfully');
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!DSN) return;

  Sentry.captureException(error, {
    extra: context,
    level: 'error',
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (!DSN) return;
  Sentry.captureMessage(message, level);
}

export function setUser(user: { id: string; email?: string; username?: string }) {
  if (!DSN) return;
  Sentry.setUser(user);
}

export function clearUser() {
  if (!DSN) return;
  Sentry.setUser(null);
}
