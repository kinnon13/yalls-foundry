/**
 * Sentry Observability
 * Error tracking and performance monitoring
 */

import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn('[Sentry] DSN not configured, skipping init');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_COMMIT_SHA || 'dev',
    
    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    
    // Session replay (optional)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Filter out known noise
    ignoreErrors: [
      /rate_limited/,
      /NetworkError/,
      /Failed to fetch/,
      'Non-Error promise rejection',
    ],
    
    beforeSend(event, hint) {
      // Scrub sensitive data
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }
      
      // Filter out dev errors in production
      if (import.meta.env.PROD && event.environment === 'development') {
        return null;
      }
      
      return event;
    },
  });
}

export { Sentry };
