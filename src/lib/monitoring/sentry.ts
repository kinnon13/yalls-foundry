// Sentry monitoring setup for production observability
import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.MODE;

export function initializeSentry() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    
    beforeSend(event, hint) {
      // Filter out non-critical errors
      if (event.level === 'info' || event.level === 'warning') {
        return null;
      }
      return event;
    },
  });
}

// Add breadcrumb for RPC calls
export function logRPCCall(rpcName: string, params: Record<string, any>) {
  Sentry.addBreadcrumb({
    category: 'rpc',
    message: `RPC: ${rpcName}`,
    level: 'info',
    data: params,
  });
}

// Capture RPC errors with context
export function captureRPCError(
  error: Error,
  rpcName: string,
  params: Record<string, any>
) {
  Sentry.withScope((scope) => {
    scope.setTag('rpc_name', rpcName);
    scope.setContext('rpc_params', params);
    Sentry.captureException(error);
  });
}

// Track user for debugging
export function identifyUser(userId: string, email?: string) {
  Sentry.setUser({ id: userId, email });
}

// Clear user on logout
export function clearUser() {
  Sentry.setUser(null);
}
