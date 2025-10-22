import { Suspense, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { OVERLAY_REGISTRY } from './registry';
import { getBaseRouteFor } from './deeplink';
import type { AppId } from '@/apps/types';
import { getCurrentRole, rank } from '@/security/role';

/**
 * OverlayHost - Modal overlay system with role-based access and deep-link sync
 * Renders based on ?app= query parameter with ESC key support, a11y, and mobile gestures
 */
export default function OverlayHost() {
  const [sp, setSp] = useSearchParams();
  const key = sp.get('app') as AppId | null;
  const cfg = key && key in OVERLAY_REGISTRY ? OVERLAY_REGISTRY[key] : null;
  const role = getCurrentRole();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const syncingRef = useRef(false);
  const titleId = useRef(`overlay-title-${key ?? 'none'}`);
  const lastFocus = useRef<HTMLElement | null>(null);
  const touch = useRef<{ y0: number; y: number; active: boolean }>({ y0: 0, y: 0, active: false });

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    if (cfg) {
      window.addEventListener('keydown', onEsc);
      // Focus management - save last focused element
      lastFocus.current = document.activeElement as HTMLElement | null;
      // Focus close button on open
      setTimeout(() => {
        const btn = document.querySelector<HTMLElement>('[data-testid="overlay-close"]');
        btn?.focus();
      }, 100);
      // Emit telemetry event
      window.dispatchEvent(new CustomEvent('overlay:open', { detail: { app: key } }));
    }
    return () => {
      window.removeEventListener('keydown', onEsc);
      if (cfg) {
        // Restore focus
        lastFocus.current?.focus?.();
        window.dispatchEvent(new CustomEvent('overlay:close', { detail: { app: key } }));
      }
    };
  }, [cfg, key]);

  // Route ↔ Overlay sync: when overlay opens, navigate to its base route
  useEffect(() => {
    if (syncingRef.current || !key || !cfg) return;
    
    const base = getBaseRouteFor(key);
    if (!base) return;

    // If overlay open but not on base route, navigate (replace) to base
    if (!pathname.startsWith(base)) {
      syncingRef.current = true;
      nav(base + '?' + sp.toString(), { replace: true });
      setTimeout(() => (syncingRef.current = false), 0);
    }
  }, [key, cfg, pathname, sp, nav]);

  function close() {
    const next = new URLSearchParams(sp);
    next.delete('app');
    setSp(next, { replace: true });
  }

  function onTouchStart(e: React.TouchEvent) {
    touch.current = { y0: e.touches[0].clientY, y: e.touches[0].clientY, active: true };
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!touch.current.active) return;
    touch.current.y = e.touches[0].clientY;
    const dy = touch.current.y - touch.current.y0;
    // Add visual hint for swipe
    (e.currentTarget as HTMLElement).setAttribute('data-swipe-hint', dy > 20 ? '1' : '0');
  }

  function onTouchEnd() {
    const dy = touch.current.y - touch.current.y0;
    touch.current.active = false;
    if (dy > 120) close(); // swipe down to close
  }

  if (!cfg) return null;

  const allowed = rank(role) >= rank(cfg.role);

  return (
    <div
      data-testid="overlay-root"
      onMouseDown={(e) => e.currentTarget === e.target && close()}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="fixed inset-0 bg-black/35 grid place-items-center z-[1000]"
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId.current}
    >
      <div className="w-[92vw] max-w-3xl max-h-[88vh] bg-background rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 id={titleId.current} className="text-lg font-semibold" data-testid="overlay-title">
            {cfg.title}
          </h2>
          <button 
            data-testid="overlay-close"
            aria-label="Close overlay" 
            onClick={close} 
            className="text-sm hover:opacity-70 transition-opacity"
          >
            ✕
          </button>
        </div>

        {!allowed ? (
          <div className="p-6" data-testid="overlay-403">
            <p className="font-medium mb-2">Access restricted</p>
            <p className="text-sm text-muted-foreground mb-4">
              This app requires <strong>{cfg.role}</strong> role. You are <strong>{role}</strong>.
            </p>
            <div className="flex gap-3">
              <a href="/auth" className="px-3 py-2 rounded bg-primary text-primary-foreground text-sm hover:opacity-90">
                Sign in
              </a>
              <button 
                onClick={close} 
                className="px-3 py-2 rounded border text-sm hover:bg-muted"
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <Suspense fallback={<div className="p-6">Loading {cfg.title}…</div>}>
            <cfg.component contextType="overlay" />
          </Suspense>
        )}
      </div>
    </div>
  );
}
