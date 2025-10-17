/**
 * useRocker Hook
 * 
 * Provides AI capabilities for features with observability and consent
 */

import { useCallback } from 'react';
import { rpcWithObs } from '@/lib/supaRpc';

export interface RockerSuggestion {
  id: string;
  action: string;
  rationale?: string;
  data?: Record<string, unknown>;
}

export function useRocker(featureId: string) {
  const suggest = useCallback(
    async (actionType: string, input: Record<string, unknown>): Promise<RockerSuggestion[]> => {
      try {
        const { data, error } = await rpcWithObs(
          'rocker_suggest',
          {
            p_feature_id: featureId,
            p_action_type: actionType,
            p_input: input,
          },
          {
            surface: 'ai_kernel',
            featureId,
          }
        );

        if (error) throw error;
        return (data as RockerSuggestion[]) || [];
      } catch (err) {
        console.error(`Rocker suggest failed for ${featureId}:`, err);
        return [];
      }
    },
    [featureId]
  );

  const act = useCallback(
    async (actionType: string, input: Record<string, unknown>): Promise<unknown> => {
      try {
        const { data, error } = await rpcWithObs(
          'rocker_act',
          {
            p_feature_id: featureId,
            p_action_type: actionType,
            p_input: input,
          },
          {
            surface: 'ai_kernel',
            featureId,
          }
        );

        if (error) throw error;
        return data;
      } catch (err) {
        console.error(`Rocker act failed for ${featureId}:`, err);
        throw err;
      }
    },
    [featureId]
  );

  const log = useCallback(
    async (actionType: string, result: 'accepted' | 'rejected' | 'dismissed', meta?: Record<string, unknown>) => {
      try {
        await rpcWithObs(
          'rocker_log_action',
          {
            p_feature_id: featureId,
            p_action_type: actionType,
            p_result: result,
            p_meta: meta,
          },
          {
            surface: 'ai_kernel',
            featureId,
          }
        );
      } catch (err) {
        // Silent - logging failures shouldn't break UX
        console.error(`Rocker log failed for ${featureId}:`, err);
      }
    },
    [featureId]
  );

  return {
    suggest,
    act,
    log,
    status: 'ready' as const,
  };
}
