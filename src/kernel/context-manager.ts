/**
 * Context Manager
 * Manages active context (user/business/farm/stallion/producer)
 */

import { create } from 'zustand';
import type { AppContext } from './types';
import { rocker } from '@/lib/rocker/event-bus';

interface ContextState {
  activeType: AppContext;
  activeId: string;
  stack: Array<{ type: AppContext; id: string }>;
}

interface ContextStore extends ContextState {
  setContext: (type: AppContext, id: string) => void;
  pushContext: (type: AppContext, id: string) => void;
  popContext: () => void;
  swipeLeft: () => void;
  swipeRight: () => void;
}

export const useContextManager = create<ContextStore>((set, get) => ({
  activeType: 'user',
  activeId: '',
  stack: [],

  setContext: (type, id) => {
    rocker.emit('context_switch', { metadata: { from: { type: get().activeType, id: get().activeId }, to: { type, id } } });
    set({ activeType: type, activeId: id });
  },

  pushContext: (type, id) => {
    const current = get();
    set({
      activeType: type,
      activeId: id,
      stack: [...current.stack, { type: current.activeType, id: current.activeId }],
    });
    rocker.emit('context_push', { metadata: { type, id } });
  },

  popContext: () => {
    const { stack } = get();
    if (stack.length === 0) return;

    const prev = stack[stack.length - 1];
    set({
      activeType: prev.type,
      activeId: prev.id,
      stack: stack.slice(0, -1),
    });
    rocker.emit('context_pop', { metadata: prev });
  },

  swipeLeft: () => {
    // TODO: Implement context carousel
    console.log('[ContextManager] Swipe left');
  },

  swipeRight: () => {
    // TODO: Implement context carousel
    console.log('[ContextManager] Swipe right');
  },
}));
