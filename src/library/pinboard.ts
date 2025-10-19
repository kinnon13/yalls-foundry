/**
 * Pinboard System
 * Pin apps to Home or Business context
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { rocker } from '@/lib/rocker/event-bus';
import type { AppId, AppContext } from '@/kernel/types';

interface Pin {
  appId: AppId;
  context: AppContext;
  contextId: string; // 'home' | businessId | farmId
  order: number;
}

interface PinboardState {
  pins: Pin[];
}

interface PinboardStore extends PinboardState {
  pin: (appId: AppId, context: AppContext, contextId: string) => void;
  unpin: (appId: AppId, contextId: string) => void;
  getPins: (contextId: string) => Pin[];
  reorder: (contextId: string, appIds: AppId[]) => void;
}

export const usePinboard = create<PinboardStore>()(
  persist(
    (set, get) => ({
      pins: [],

      pin: (appId, context, contextId) => {
        const { pins } = get();
        
        // Check if already pinned
        if (pins.some(p => p.appId === appId && p.contextId === contextId)) {
          return;
        }

        const newPin: Pin = {
          appId,
          context,
          contextId,
          order: pins.filter(p => p.contextId === contextId).length,
        };

        set({ pins: [...pins, newPin] });
        rocker.emit('app_pinned', { metadata: { appId, contextId } });
      },

      unpin: (appId, contextId) => {
        const { pins } = get();
        const filtered = pins.filter(p => !(p.appId === appId && p.contextId === contextId));
        set({ pins: filtered });
        rocker.emit('app_unpinned', { metadata: { appId, contextId } });
      },

      getPins: (contextId) => {
        return get().pins
          .filter(p => p.contextId === contextId)
          .sort((a, b) => a.order - b.order);
      },

      reorder: (contextId, appIds) => {
        const { pins } = get();
        const updated = pins.map(pin => {
          if (pin.contextId !== contextId) return pin;
          const newOrder = appIds.indexOf(pin.appId);
          return newOrder >= 0 ? { ...pin, order: newOrder } : pin;
        });
        set({ pins: updated });
        rocker.emit('pinboard_reordered', { metadata: { contextId, appIds } });
      },
    }),
    {
      name: 'rocker-pinboard',
    }
  )
);

/**
 * Pre-pinned apps for Producer context
 */
export const PRODUCER_PRE_PINS: AppId[] = [
  'crm',
  'listings',
  'events',
  'earnings',
  'incentives',
];
