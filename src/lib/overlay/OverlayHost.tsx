import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OVERLAY_REGISTRY } from './registry';
import type { AppId } from '@/apps/types';
import { getCurrentRole, rank } from '@/security/role';

/**
 * OverlayHost - Modal overlay system with role-based access control
 * Renders based on ?app= query parameter with ESC key support and telemetry
 */
export default function OverlayHost() {
  const [sp, setSp] = useSearchParams();
  const key = sp.get('app') as AppId | null;
  const cfg = key && key in OVERLAY_REGISTRY ? OVERLAY_REGISTRY[key] : null;
  const role = getCurrentRole();

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    if (cfg) {
      window.addEventListener('keydown', onEsc);
      // Emit telemetry event
      window.dispatchEvent(new CustomEvent('overlay:open', { detail: { app: key } }));
    }
    return () => {
      window.removeEventListener('keydown', onEsc);
      if (cfg) {
        window.dispatchEvent(new CustomEvent('overlay:close', { detail: { app: key } }));
      }
    };
  }, [cfg, key]);

  function close() {
    const next = new URLSearchParams(sp);
    next.delete('app');
    setSp(next, { replace: true });
  }

  if (!cfg) return null;

  const allowed = rank(role) >= rank(cfg.role);

  return (
    <div
      data-testid="overlay-root"
      onMouseDown={(e) => e.currentTarget === e.target && close()}
      className="fixed inset-0 bg-black/35 grid place-items-center z-[1000]"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-[92vw] max-w-3xl max-h-[88vh] bg-background rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold" data-testid="overlay-title">
            {cfg.title}
          </h2>
          <button 
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
