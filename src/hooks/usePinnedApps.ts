/**
 * Pinned Apps Hook
 * Manages which apps are pinned to the dock
 */

import { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface PinnedApp {
  id: string;
  label: string;
  icon: string;
  gradient: string;
  color: string;
}

const DEFAULT_PINNED_APPS: PinnedApp[] = [
  { id: 'messages', label: 'Messages', icon: 'MessageSquare', gradient: 'from-violet-600 via-purple-600 to-fuchsia-500', color: 'text-white' },
  { id: 'marketplace', label: 'Marketplace', icon: 'ShoppingBag', gradient: 'from-green-500 via-emerald-500 to-teal-400', color: 'text-white' },
  { id: 'events', label: 'Events', icon: 'Calendar', gradient: 'from-red-500 via-orange-500 to-amber-400', color: 'text-white' },
  { id: 'orders', label: 'Orders', icon: 'ShoppingCart', gradient: 'from-blue-500 via-blue-600 to-cyan-500', color: 'text-white' },
];

const STORAGE_KEY = 'yalls-pinned-apps';

export function usePinnedApps() {
  const [pinnedApps, setPinnedApps] = useState<PinnedApp[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_PINNED_APPS;
    } catch {
      return DEFAULT_PINNED_APPS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedApps));
  }, [pinnedApps]);

  const pinApp = (app: PinnedApp) => {
    setPinnedApps(prev => {
      if (prev.some(p => p.id === app.id)) return prev;
      return [...prev, app];
    });
  };

  const unpinApp = (appId: string) => {
    setPinnedApps(prev => prev.filter(p => p.id !== appId));
  };

  const isPinned = (appId: string) => {
    return pinnedApps.some(p => p.id === appId);
  };

  return {
    pinnedApps,
    pinApp,
    unpinApp,
    isPinned,
  };
}
