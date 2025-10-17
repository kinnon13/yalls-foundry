import { useEffect } from 'react';
import { PreviewEventSchema } from './schema';
import { validatePreviewToken } from '@/lib/security/hmac';
import type { PreviewEvent, HMACToken } from './schema';

// Explicit origin allowlist - fail closed
const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:3000',
  'https://app.yalls.ai',
  'https://staging.yalls.ai',
]);

// Add current origin dynamically (for preview <-> parent communication)
if (typeof window !== 'undefined') {
  ALLOWED_ORIGINS.add(window.location.origin);
}

/**
 * Hook to listen for preview messages with HMAC validation
 * Defense-in-depth: origin + HMAC + schema + dedup
 */
export function usePreviewMessage(handler: (event: PreviewEvent) => void) {
  useEffect(() => {
    const processedMessages = new Set<string>();

    const listener = async (e: MessageEvent) => {
      // 1. Origin validation
      if (!ALLOWED_ORIGINS.has(e.origin)) {
        console.warn('[PreviewMessage] Blocked: untrusted origin', e.origin);
        return;
      }

      const msg = e.data;
      if (!msg || typeof msg !== 'object') return;

      // 2. Schema validation
      const parsed = PreviewEventSchema.safeParse(msg);
      if (!parsed.success) {
        console.warn('[PreviewMessage] Blocked: invalid schema', parsed.error);
        return;
      }

      const event = parsed.data;

      // 3. HMAC validation (skip for security events or if HMAC incomplete)
      if (event.source !== 'preview-security' && event.hmac) {
        // Runtime check ensures all fields exist before validation
        const hmacData = event.hmac;
        if (!hmacData.tk || !hmacData.exp || !hmacData.origin) {
          console.warn('[PreviewMessage] Blocked: incomplete HMAC token');
          return;
        }
        
        try {
          const validation = await validatePreviewToken(
            hmacData as { tk: string; exp: number; origin: string },
            e.origin
          );
          if (!validation.valid) {
            console.warn('[PreviewMessage] Blocked: HMAC validation failed', validation.reason);
            return;
          }
        } catch (hmacError) {
          console.error('[PreviewMessage] HMAC validation error:', hmacError);
          return;
        }
      }

      // 4. Deduplication (5 second window)
      const msgId = `${event.source}:${event.type}:${event.timestamp || Date.now()}`;
      if (processedMessages.has(msgId)) {
        console.warn('[PreviewMessage] Blocked: duplicate message', msgId);
        return;
      }
      processedMessages.add(msgId);
      setTimeout(() => processedMessages.delete(msgId), 5000);

      // 5. Safe to handle
      handler(event);
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [handler]);
}

/**
 * Send preview message to opener with target origin from URL param
 * Parent passes origin + HMAC when opening window
 */
export function sendPreviewMessage(event: any) {
  if (!window.opener) {
    console.warn('[PreviewMessage] No opener window');
    return;
  }

  if (!window.location.pathname.startsWith('/preview')) {
    console.error('[PreviewMessage] Can only send from preview routes');
    return;
  }

  // Read parent origin from URL param (set by parent when opening window)
  const params = new URLSearchParams(window.location.search);
  const parentOrigin = params.get('parent') || window.location.origin;
  const hmacParam = params.get('tk');
  const expParam = params.get('exp');

  if (!ALLOWED_ORIGINS.has(parentOrigin)) {
    console.error('[PreviewMessage] Parent origin not in allowlist:', parentOrigin);
    return;
  }

  // Include HMAC from URL if present
  let hmac: HMACToken | undefined;
  if (hmacParam && expParam) {
    hmac = {
      tk: hmacParam,
      exp: parseInt(expParam, 10),
      origin: parentOrigin
    };
  }

  const fullEvent = {
    ...event,
    timestamp: Date.now(),
    hmac,
  };

  window.opener.postMessage(fullEvent, parentOrigin);
}
