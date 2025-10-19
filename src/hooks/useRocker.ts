/**
 * useRocker Hook
 * Unified access to Rocker OS kernel
 */

export interface RockerMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

import { useCommand } from './useCommand';
import { useContextManager } from '@/kernel/context-manager';
import { useDesignLock } from '@/kernel/design-lock';
import { contractRegistry } from '@/kernel/contract-registry';
import { rocker } from '@/lib/rocker/event-bus';
import type { AppId, ActionId, IntentId } from '@/kernel/types';

export function useRocker() {
  const command = useCommand();
  const context = useContextManager();
  const designLock = useDesignLock();

  return {
    // Command Bus
    invoke: command.invoke,
    loading: command.loading,
    result: command.result,

    // Context Manager
    context: {
      activeType: context.activeType,
      activeId: context.activeId,
      setContext: context.setContext,
      pushContext: context.pushContext,
      popContext: context.popContext,
      swipeLeft: context.swipeLeft,
      swipeRight: context.swipeRight,
    },

    // Design Lock
    designLock: {
      isLocked: designLock.isLocked,
      lock: designLock.lock,
      unlock: designLock.unlock,
      setPin: designLock.setPin,
    },

    // Contract Registry
    contracts: {
      get: contractRegistry.get,
      getAll: contractRegistry.getAll,
      findByIntent: contractRegistry.findByIntent,
      findByContext: contractRegistry.findByContext,
    },

    // Event Bus
    events: {
      emit: rocker.emit,
      on: rocker.on,
      onAny: rocker.onAny,
      getLog: rocker.getLog,
    },

    // Suggestions (stub for now)
    suggest: async (intent: IntentId): Promise<{ appId: AppId; actionId: ActionId; params: any }[]> => {
      // TODO: Call Rocker AI to generate suggestions
      const apps = contractRegistry.findByIntent(intent);
      return apps.map(app => ({
        appId: app.id,
        actionId: Object.keys(app.actions)[0] as ActionId,
        params: {},
      }));
    },
  };
}
