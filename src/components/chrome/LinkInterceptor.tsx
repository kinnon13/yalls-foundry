/**
 * Link Interceptor - Hijacks legacy links to open overlays
 */

import { useEffect } from 'react';
import { useOpenApp } from '@/lib/nav/useOpenApp';
import type { OverlayKey } from '@/lib/overlay/types';

const overlayPaths = new Map<string, OverlayKey>([
  ['/crm', 'crm'],
  ['/marketplace', 'marketplace'],
  ['/messages', 'messages'],
  ['/orders', 'orders'],
  ['/events', 'events'],
  ['/listings', 'marketplace'],
]);

export default function LinkInterceptor() {
  const openApp = useOpenApp();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a') as HTMLAnchorElement | null;
      if (!a) return;
      
      const url = new URL(a.href, window.location.origin);
      const appId = overlayPaths.get(url.pathname);
      
      if (appId) {
        e.preventDefault();
        e.stopPropagation();
        openApp(appId);
      }
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [openApp]);

  return null;
}
