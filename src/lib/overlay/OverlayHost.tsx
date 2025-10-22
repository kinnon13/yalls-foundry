import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OVERLAY_REGISTRY } from './registry';
import type { AppId } from '@/apps/types';

/**
 * OverlayHost - Modal overlay system with ESC key support and telemetry
 * Renders based on ?app= query parameter
 */
export default function OverlayHost() {
  const [sp, setSp] = useSearchParams();
  const key = sp.get('app') as AppId | null;
  const cfg = key && key in OVERLAY_REGISTRY ? OVERLAY_REGISTRY[key] : null;

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
  const Comp = cfg.component;

  return (
    <div 
      data-testid="overlay-root"
      role="dialog" 
      aria-label={cfg.title}
      aria-modal="true"
      onClick={(e) => e.currentTarget === e.target && close()}
      className="fixed inset-0 bg-black/35 grid place-items-center z-[1000]"
    >
      <div className="w-full max-w-[980px] max-h-[85vh] overflow-auto rounded-xl bg-background p-4 shadow-lg">
        <div className="flex justify-between items-center mb-2">
          <strong data-testid="overlay-title">{cfg.title}</strong>
          <button 
            onClick={close} 
            aria-label="Close overlay"
            className="text-2xl leading-none hover:opacity-70 transition-opacity"
          >
            ✕
          </button>
        </div>
        <Suspense fallback={<div>Loading {cfg.title}…</div>}>
          <Comp contextType="overlay" />
        </Suspense>
      </div>
    </div>
  );
}
