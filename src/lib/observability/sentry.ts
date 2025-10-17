import * as Sentry from '@sentry/browser';

const DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!DSN) return;
  
  Sentry.init({
    dsn: DSN,
    integrations: [
      Sentry.browserTracingIntegration(), 
      Sentry.replayIntegration()
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    release: import.meta.env.VITE_COMMIT_SHA || 'dev',
    environment: import.meta.env.MODE,
  });
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  if (!DSN) return;
  Sentry.captureException(err, { extra: context });
}
