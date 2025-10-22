import React, { Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OVERLAY_REGISTRY } from './registry';
import type { OverlayKey } from './types';

/**
 * OverlayHost - Renders overlays based on ?app= query parameter
 * Uses lazy loading for code splitting and performance
 */
export default function OverlayHost() {
  const [params] = useSearchParams();
  const key = params.get('app') as OverlayKey | null;
  
  if (!key) return null;
  
  const entry = OVERLAY_REGISTRY[key];
  if (!entry) {
    console.warn(`Unknown overlay key: ${key}`);
    return null;
  }

  const Component = entry.component;
  
  return (
    <div data-testid="overlay-host" className="overlay-container">
      <Suspense fallback={
        <div data-testid="overlay-loading" className="flex items-center justify-center p-8">
          <div className="animate-pulse">Loading {entry.title}...</div>
        </div>
      }>
        <Component contextType="user" contextId="" mode="overlay" />
      </Suspense>
    </div>
  );
}
