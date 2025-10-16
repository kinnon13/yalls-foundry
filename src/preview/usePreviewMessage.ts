import { useEffect } from 'react';

// Origin allowlist - only accept messages from these domains
const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:3000',
  'https://app.yalls.ai',
  'https://pay.yalls.ai',
  'https://admin.yalls.ai',
  'https://data.yalls.ai',
]);

// Add current origin dynamically
if (typeof window !== 'undefined') {
  ALLOWED_ORIGINS.add(window.location.origin);
}

export type PreviewEventSource = 'pay-preview' | 'admin-preview' | 'data-preview' | 'app-preview';

export type PreviewEvent =
  | { source: 'pay-preview'; type: 'PAYMENT_SUCCESS'; orderId: string; intentId?: string }
  | { source: 'pay-preview'; type: 'PAYMENT_FAIL'; orderId?: string; reason?: string }
  | { source: 'pay-preview'; type: 'KYC_COMPLETE'; accountId?: string }
  | { source: 'pay-preview'; type: 'LABEL_PURCHASED'; orderId: string; carrier?: string; tracking?: string }
  | { source: 'admin-preview'; type: 'RISK_ACTION'; action: string; targetId?: string }
  | { source: 'data-preview'; type: 'EXPORT_REQUESTED'; format: string; filters?: any }
  | { source: 'app-preview'; type: 'ORDER_VIEWED'; orderId: string };

/**
 * Hook to listen for preview hand-off messages with origin validation
 */
export function usePreviewMessage(handler: (event: PreviewEvent) => void) {
  useEffect(() => {
    const listener = (e: MessageEvent) => {
      // Origin validation - critical security check
      if (!ALLOWED_ORIGINS.has(e.origin)) {
        console.warn('[PreviewMessage] Rejected message from untrusted origin:', e.origin);
        return;
      }

      const msg = e.data;
      if (!msg || typeof msg !== 'object') return;

      // Source validation
      const validSources: PreviewEventSource[] = ['pay-preview', 'admin-preview', 'data-preview', 'app-preview'];
      if (!validSources.includes(msg.source)) return;

      // Type validation
      if (!msg.type || typeof msg.type !== 'string') return;

      // Safe to handle
      handler(msg as PreviewEvent);
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [handler]);
}

/**
 * Utility to send preview message to opener (from preview page)
 */
export function sendPreviewMessage(event: PreviewEvent) {
  if (!window.opener) {
    console.warn('[PreviewMessage] No opener window to send message to');
    return;
  }

  // Only send if we're in a preview route
  if (!window.location.pathname.startsWith('/preview')) {
    console.error('[PreviewMessage] Can only send from preview routes');
    return;
  }

  const targetOrigin = window.opener.location.origin || '*';
  window.opener.postMessage(event, targetOrigin);
}
