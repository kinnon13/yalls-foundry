/**
 * Rocker Actions - Next Best Actions and AI suggestions
 */

import { supabase } from '@/integrations/supabase/client';

export interface NextBestAction {
  action: string;
  why: string;
  cta: string;
  href: string;
}

export async function fetchNextBestActions(userId: string): Promise<NextBestAction[]> {
  try {
    const { data, error } = await supabase.rpc('rocker_next_best_actions', {
      p_user_id: userId
    });

    if (error) throw error;
    const actionsArray = Array.isArray(data) ? data : [];
    return actionsArray.map((row: any) => row as NextBestAction);
  } catch (error) {
    console.error('[Rocker] Failed to fetch actions:', error);
    return [];
  }
}

export async function logAiAction(
  userId: string,
  action: string,
  input: any,
  output: any,
  result: 'success' | 'error' = 'success'
): Promise<void> {
  try {
    await supabase.from('ai_action_ledger').insert({
      tenant_id: userId,
      user_id: userId,
      agent: 'rocker',
      action,
      input: input || {},
      output: output || {},
      result
    });
  } catch (error) {
    console.error('[Rocker] Failed to log action:', error);
  }
}
