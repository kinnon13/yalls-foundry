/**
 * Pinned Apps Hook
 * Manages which apps are pinned to the dock
 */

import { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface PinnedApp {
  id: string;
  label: string;
  icon: string; // We'll store icon name as string
}

const DEFAULT_PINNED_APPS: PinnedApp[] = [
  { id: 'messages', label: 'Messages', icon: 'MessageSquare' },
  { id: 'marketplace', label: 'Marketplace', icon: 'ShoppingBag' },
  { id: 'events', label: 'Events', icon: 'Calendar' },
  { id: 'orders', label: 'Orders', icon: 'Users' },
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
