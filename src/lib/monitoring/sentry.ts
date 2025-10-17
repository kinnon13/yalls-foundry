import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry error tracking
 * Set VITE_SENTRY_DSN env var to enable
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.info('Sentry not configured (VITE_SENTRY_DSN missing)');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || 'dev',
    
    // Sample 10% of errors in production
    sampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    
    // Track performance
    tracesSampleRate: 0.1,
    
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Filter sensitive data
    beforeSend(event) {
      // Remove PII from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(crumb => ({
          ...crumb,
          data: filterSensitiveData(crumb.data),
        }));
      }
      return event;
    },
  });
}

/**
 * Capture exception with context
 */
export function captureError(
  error: Error,
  context?: {
    featureId?: string;
    userId?: string;
    action?: string;
    metadata?: Record<string, any>;
  }
) {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.error('Error:', error, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.featureId) scope.setTag('feature', context.featureId);
    if (context?.userId) scope.setUser({ id: context.userId });
    if (context?.action) scope.setTag('action', context.action);
    if (context?.metadata) scope.setContext('metadata', context.metadata);
    
    Sentry.captureException(error);
  });
}

/**
 * Track feature boundary failures
 */
export function trackFeatureError(
  featureId: string,
  error: Error,
  metadata?: Record<string, any>
) {
  captureError(error, { featureId, metadata });
}

// Filter sensitive fields
function filterSensitiveData(data?: Record<string, any>): Record<string, any> | undefined {
  if (!data) return data;
  
  const sensitive = ['password', 'token', 'apikey', 'email', 'phone'];
  const filtered = { ...data };
  
  for (const key of Object.keys(filtered)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      filtered[key] = '[REDACTED]';
    }
  }
  
  return filtered;
}
