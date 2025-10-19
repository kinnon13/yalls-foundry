/**
 * useCommand Hook
 * Invoke app actions via Command Bus
 */

import { useState, useCallback } from 'react';
import { commandBus } from '@/kernel/command-bus';
import { useContextManager } from '@/kernel/context-manager';
import { useSession } from '@/lib/auth/context';
import type { AppId, ActionId, CommandResult } from '@/kernel/types';

export function useCommand() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CommandResult | null>(null);
  const { session } = useSession();
  const { activeType, activeId } = useContextManager();

  const invoke = useCallback(
    async (
      appId: AppId,
      actionId: ActionId,
      params: Record<string, any>,
      options?: { idempotencyKey?: string }
    ): Promise<CommandResult> => {
      if (!session) {
        const error = { success: false, error: 'Not authenticated' };
        setResult(error);
        return error;
      }

      setLoading(true);
      setResult(null);

      try {
        const invocation = {
          appId,
          actionId,
          params,
          context: {
            userId: session.userId,
            contextType: activeType,
            contextId: activeId || session.userId,
          },
          idempotencyKey: options?.idempotencyKey,
        };

        const res = await commandBus.invoke(invocation);
        setResult(res);
        return res;
      } catch (e: any) {
        const error = { success: false, error: e.message };
        setResult(error);
        return error;
      } finally {
        setLoading(false);
      }
    },
    [session, activeType, activeId]
  );

  return { invoke, loading, result };
}
