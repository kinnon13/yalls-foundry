/**
 * Overlay Provider
 * Primary navigation: ?app=key opens overlays in-place
 */

import React, { createContext, useContext, useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { OverlayKey, OverlayState } from './types';
import { OVERLAY_REGISTRY } from './registry';
import { useSession } from '@/lib/auth/context';
import { rocker } from '@/lib/rocker/event-bus';

interface OverlayContextValue {
  state: OverlayState;
  openOverlay: (key: OverlayKey, params?: Record<string, string>) => void;
  closeOverlay: () => void;
  open: (key: OverlayKey, params?: Record<string, string>) => void;  // Alias for easier use
  close: () => void;  // Alias for easier use
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function OverlayProvider({ children }: { children: React.ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session } = useSession();
  const userId = session?.userId;
  
  const activeKey = (searchParams.get('app') as OverlayKey) || null;
  const isOpen = activeKey !== null;
  
  // Extract params (all except 'app')
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key !== 'app') params[key] = value;
  });

  const state: OverlayState = { isOpen, activeKey, params };

  const openOverlay = useCallback((key: OverlayKey, newParams?: Record<string, string>) => {
    const config = OVERLAY_REGISTRY[key];
    if (!config) {
      console.warn(`[Overlay] Unknown key: ${key}`);
      return;
    }

    // Auth guard
    if (config.requiresAuth && !userId) {
      console.warn(`[Overlay] ${key} requires auth`);
      navigate('/login');
      return;
    }

    // Build new search params
    const next = new URLSearchParams(searchParams);
    next.set('app', key);
    
    if (newParams) {
      Object.entries(newParams).forEach(([k, v]) => next.set(k, v));
    }

    setSearchParams(next);
    rocker.emit('overlay_open', { metadata: { key, params: newParams } });
  }, [searchParams, setSearchParams, userId, navigate]);

  const closeOverlay = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    const closedKey = next.get('app');
    next.delete('app');
    // Keep other params
    setSearchParams(next);
    rocker.emit('overlay_close', { metadata: { key: closedKey } });
  }, [searchParams, setSearchParams]);

  // ESC key closes overlay
  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeOverlay();
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, closeOverlay]);

  // Intercept internal links
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto:')) return;

      // Check if it matches an overlay route
      const matchKey = Object.keys(OVERLAY_REGISTRY).find(k => 
        href.startsWith(`/${k}`) || href === `/${k}`
      );

      if (matchKey) {
        e.preventDefault();
        openOverlay(matchKey as OverlayKey);
      }
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [openOverlay]);

  const value: OverlayContextValue = { 
    state, 
    openOverlay, 
    closeOverlay,
    open: openOverlay,  // Alias
    close: closeOverlay  // Alias
  };

  return (
    <OverlayContext.Provider value={value}>
      {children}
      
      {/* Render active overlay with Mac-style window */}
      {isOpen && activeKey && (
        <div className="wm-layer">
          <div className="wm-scrim" onClick={closeOverlay} />
          <div className="wm-window" data-ready>
            <div className="wm-titlebar">
              <div className="wm-traffic">
                <button className="dot red" onClick={closeOverlay} aria-label="Close" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="wm-title">{OVERLAY_REGISTRY[activeKey]?.title || activeKey}</div>
              <div className="wm-tools" />
            </div>
            <div className="wm-content">
              <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                {React.createElement(OVERLAY_REGISTRY[activeKey].component, { params })}
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </OverlayContext.Provider>
  );
}

export function useOverlay() {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error('useOverlay must be used within OverlayProvider');
  return ctx;
}
