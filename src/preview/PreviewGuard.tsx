import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminCheck } from '@/hooks/useAdminCheck';

const PREVIEW_ENABLED = import.meta.env.VITE_PREVIEW_ENABLED === 'true';

/**
 * PreviewGuard - Defense-in-depth security for preview routes
 * - Env flag + admin check
 * - Blocks ALL mutation channels (fetch, XHR, sendBeacon, WebSocket, forms, SW)
 * - Fail-closed architecture
 */
export function PreviewGuard() {
  const { isAdmin, isLoading } = useAdminCheck();

  useEffect(() => {
    if (!window.location.pathname.startsWith('/preview')) return;

    // 1. Block fetch mutations
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [input, init] = args;
      const method = init?.method?.toUpperCase() || 'GET';
      
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        console.error('[PreviewGuard] Fetch blocked:', method, input);
        
        // Notify parent of blocked write attempt
        if (window.opener) {
          window.opener.postMessage({
            type: 'BLOCKED_WRITE',
            source: 'preview-security',
            method,
            url: typeof input === 'string' ? input : input.toString(),
            timestamp: Date.now()
          }, window.location.origin);
        }
        
        throw new Error('Write operations blocked in preview mode');
      }
      
      return originalFetch(...args);
    };

    // 2. Block XMLHttpRequest mutations
    const OriginalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = class BlockedXHR extends OriginalXHR {
      open(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null): void {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
          console.error('[PreviewGuard] XHR blocked:', method, url);
          
          if (window.opener) {
            window.opener.postMessage({
              type: 'BLOCKED_WRITE',
              source: 'preview-security',
              method,
              url: url.toString(),
              timestamp: Date.now()
            }, window.location.origin);
          }
          
          throw new Error('XHR mutations blocked in preview mode');
        }
        super.open(method, url, async ?? true, username ?? null, password ?? null);
      }
    };

    // 3. Block sendBeacon
    if ('sendBeacon' in navigator) {
      const originalSendBeacon = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = (...args) => {
        console.warn('[PreviewGuard] sendBeacon blocked');
        return false; // Pretend it failed
      };
    }

    // 4. Block WebSocket
    const OriginalWebSocket = window.WebSocket;
    window.WebSocket = class BlockedWebSocket extends OriginalWebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols); // Must call super first
        this.close(); // Then immediately close
        console.error('[PreviewGuard] WebSocket blocked:', url);
        throw new Error('WebSocket blocked in preview mode');
      }
    };

    // 5. Block EventSource
    const OriginalEventSource = window.EventSource;
    window.EventSource = class BlockedEventSource extends OriginalEventSource {
      constructor(url: string | URL, eventSourceInitDict?: EventSourceInit) {
        super(url, eventSourceInitDict); // Must call super first
        this.close(); // Then immediately close
        console.error('[PreviewGuard] EventSource blocked:', url);
        throw new Error('EventSource blocked in preview mode');
      }
    };

    // 6. Block form submissions
    const handleSubmit = (e: SubmitEvent) => {
      e.preventDefault();
      console.error('[PreviewGuard] Form submission blocked');
      if (window.opener) {
        window.opener.postMessage({
          type: 'BLOCKED_WRITE',
          source: 'preview-security',
          method: 'FORM_SUBMIT',
          timestamp: Date.now()
        }, window.location.origin);
      }
    };
    document.addEventListener('submit', handleSubmit, true);

    // 7. Unregister service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(r => {
          console.log('[PreviewGuard] Unregistering service worker:', r.scope);
          r.unregister();
        });
      });
    }

    // Cleanup
    return () => {
      window.fetch = originalFetch;
      window.XMLHttpRequest = OriginalXHR;
      window.WebSocket = OriginalWebSocket;
      window.EventSource = OriginalEventSource;
      document.removeEventListener('submit', handleSubmit, true);
    };
  }, []);

  // Gate: env flag must be on
  if (!PREVIEW_ENABLED) {
    return <Navigate to="/" replace />;
  }

  // Gate: must be admin
  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Checking access...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
