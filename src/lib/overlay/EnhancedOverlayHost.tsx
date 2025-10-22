/**
 * Enhanced Overlay Host
 * Keyboard navigation + focus management + responsive
 */

import React, { useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OVERLAY_REGISTRY, type OverlayKey } from './registry';
import { X } from 'lucide-react';
import { sendUIEvent } from '@/telemetry/ui';

export function EnhancedOverlayHost() {
  const [searchParams, setSearchParams] = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const key = searchParams.get('app') as OverlayKey | null;
  const config = key ? OVERLAY_REGISTRY[key] : null;

  useEffect(() => {
    if (key && config) {
      sendUIEvent('overlay_open', { key, title: config.title });
    }
  }, [key, config]);

  useEffect(() => {
    if (!key) return;
    
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [key]);

  function close() {
    const next = new URLSearchParams(searchParams);
    const closedKey = next.get('app');
    next.delete('app');
    setSearchParams(next);
    if (closedKey) sendUIEvent('overlay_close', { key: closedKey });
  }

  if (!key || !config) return null;

  const Component = config.component;

  return (
    <div
      data-testid="overlay-root"
      role="dialog"
      aria-modal="true"
      aria-label={config.title}
      className="fixed inset-0 z-50 grid place-items-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="
          max-h-[90vh] w-full sm:w-[min(96vw,900px)] lg:w-[min(92vw,1100px)]
          rounded-t-2xl sm:rounded-xl bg-card p-4 shadow-xl
          focus:outline-none
        "
      >
        <header className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold">{config.title}</h2>
          <button
            data-testid="overlay-close"
            aria-label="Close overlay"
            onClick={close}
            className="p-2 rounded-full hover:bg-accent transition-colors"
          >
            <X size={20} />
          </button>
        </header>
        <main className="overflow-auto max-h-[75vh] focus:outline-none">
          <Suspense fallback={<div className="p-8 text-center">Loading {config.title}...</div>}>
            <Component contextType="user" contextId="" mode="overlay" />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
