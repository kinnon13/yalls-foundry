/**
 * Route-to-Overlay Bridge
 * Auto-opens overlay when user navigates to a route that has an app owner
 */

import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { findAppForRoute } from './deeplink';

export function RouteToOverlayBridge() {
  const [sp, setSp] = useSearchParams();
  const { pathname } = useLocation();

  useEffect(() => {
    // Skip if overlay is already open
    if (sp.get('app')) return;
    
    // Find app that owns this route
    const appId = findAppForRoute(pathname);
    if (!appId) return;

    // Open overlay by setting ?app=
    const next = new URLSearchParams(sp);
    next.set('app', appId);
    setSp(next, { replace: true });
  }, [pathname, sp, setSp]);

  return null;
}
