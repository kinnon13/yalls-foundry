/**
 * Pinned Apps Hook
 * Manages which app IDs are pinned to the dock
 * Apps are pulled from central registry
 */

import { useState, useEffect } from 'react';
import { DEFAULT_PINNED_APP_IDS, getAppsByIds, type AppConfig } from '@/config/apps';
import type { OverlayKey } from '@/lib/overlay/types';

const STORAGE_KEY = 'yalls-pinned-apps';

export function usePinnedApps() {
  const [pinnedAppIds, setPinnedAppIds] = useState<OverlayKey[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_PINNED_APP_IDS;
    } catch {
      return DEFAULT_PINNED_APP_IDS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedAppIds));
  }, [pinnedAppIds]);

  // Get full app configs for pinned IDs
  const pinnedApps = getAppsByIds(pinnedAppIds);

  const pinApp = (appId: OverlayKey) => {
    setPinnedAppIds(prev => {
      if (prev.includes(appId)) return prev;
      return [...prev, appId];
    });
  };

  const unpinApp = (appId: string) => {
    setPinnedAppIds(prev => prev.filter(id => id !== appId));
  };

  const isPinned = (appId: string) => {
    return pinnedAppIds.includes(appId as OverlayKey);
  };

  const reorderApps = (newOrder: AppConfig[]) => {
    setPinnedAppIds(newOrder.map(app => app.id));
  };

  return {
    pinnedApps,
    pinApp,
    unpinApp,
    isPinned,
    reorderApps,
  };
}
