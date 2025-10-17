/**
 * Task 13: Sentry Everywhere
 * Error tracking with user/job context
 */

import * as Sentry from '@sentry/react';

export function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('[Sentry] DSN not configured, skipping init');
    return;
  }
  
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Performance
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: import.meta.env.PROD ? 0.01 : 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Privacy
    beforeSend(event, hint) {
      // Hash user IDs for privacy
      if (event.user?.id) {
        event.user.id = hashUserId(String(event.user.id));
      }
      
      // Scrub sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(crumb => {
          if (crumb.data) {
            delete crumb.data.password;
            delete crumb.data.token;
            delete crumb.data.apiKey;
          }
          return crumb;
        });
      }
      
      return event;
    },
  });
}

/**
 * Set user context (call after auth)
 */
export function setSentryUser(userId: string | null) {
  if (userId) {
    Sentry.setUser({ id: hashUserId(userId) });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Capture error with context
 */
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
}

/**
 * Capture RPC error with timing
 */
export function captureRPCError(
  rpcName: string,
  error: Error,
  duration: number,
  userId?: string
) {
  Sentry.captureException(error, {
    tags: {
      rpc_name: rpcName,
      duration_ms: duration.toString(),
    },
    user: userId ? { id: hashUserId(userId) } : undefined,
  });
}

/**
 * Capture worker job error
 */
export function captureJobError(
  jobType: string,
  jobId: string,
  error: Error,
  payload?: any
) {
  Sentry.captureException(error, {
    tags: {
      job_type: jobType,
      job_id: jobId,
    },
    contexts: {
      job: {
        type: jobType,
        id: jobId,
        payload: payload ? JSON.stringify(payload) : undefined,
      },
    },
  });
}

/**
 * Simple hash for user IDs (privacy)
 */
function hashUserId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }
  return `u${Math.abs(hash).toString(36)}`;
}

/**
 * Error boundary component
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;
