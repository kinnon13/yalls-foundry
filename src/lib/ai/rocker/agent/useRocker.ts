/**
 * useRocker Hook
 * Lightweight API for section-level Rocker integration
 */

import { useCallback } from 'react';
import { useRockerAgent } from './RockerAgentProvider';
import { supabase } from '@/integrations/supabase/client';

export function useRocker() {
  const { userId, entityId, route, section } = useRockerAgent();

  const log = useCallback(async (
    action: string,
    input: Record<string, any> = {},
    output: Record<string, any> = {},
    result: 'success' | 'error' = 'success'
  ) => {
    if (!userId) return;

    try {
      // Check consent first
      const { data: consentCheck } = await supabase.rpc('rocker_check_consent', {
        p_user_id: userId,
        p_action_type: 'telemetry_basic'
      }) as { data: { allowed: boolean } | null };

      if (!consentCheck?.allowed) return;

      // Log the action
      await supabase.rpc('rocker_log_action', {
        p_user_id: userId,
        p_agent: 'rocker_agent',
        p_action: action,
        p_input: { ...input, section, route, entity_id: entityId },
        p_output: output,
        p_result: result
      });
    } catch (error) {
      console.error('[Rocker] Failed to log action:', error);
    }
  }, [userId, entityId, route, section]);

  const suggest = useCallback(async (actionType: string): Promise<any[]> => {
    if (!userId || !entityId) return [];

    try {
      // Fetch next best actions
      const { data } = await supabase
        .from('ai_action_ledger')
        .select('*')
        .eq('user_id', userId)
        .limit(5);
      return data || [];
    } catch (error) {
      console.error('[Rocker] Failed to fetch suggestions:', error);
      return [];
    }
  }, [userId, entityId]);

  const act = useCallback(async (
    actionType: string,
    params: Record<string, any> = {}
  ): Promise<any> => {
    if (!userId) throw new Error('Not authenticated');

    try {
      // Simple action logging for now
      // Route to appropriate actions based on type
      await log(actionType, params, {}, 'success');
      
      return { success: true };
    } catch (error) {
      console.error('[Rocker] Failed to execute action:', error);
      throw error;
    }
  }, [userId, entityId, log]);

  const why = useCallback((reason: string): string => {
    return reason;
  }, []);

  return {
    log,
    suggest,
    act,
    why,
    section,
    userId,
    entityId,
  };
}
