/**
 * Interaction Logger
 * 
 * Logs all AI interactions with comprehensive pass/fail tracking
 */

import { supabase } from '@/integrations/supabase/client';

export async function logInteraction({
  userId,
  sessionId,
  interactionType,
  intent,
  toolCalled,
  parameters,
  resultStatus,
  errorMessage,
  userCorrection,
  businessContext
}: {
  userId: string;
  sessionId?: string;
  interactionType: string;
  intent: string;
  toolCalled?: string;
  parameters?: any;
  resultStatus: 'success' | 'failure' | 'partial';
  errorMessage?: string;
  userCorrection?: string;
  businessContext?: any;
}) {
  try {
    const { error } = await supabase
      .from('ai_interaction_log')
      .insert({
        user_id: userId,
        session_id: sessionId,
        interaction_type: interactionType,
        intent,
        tool_called: toolCalled,
        parameters,
        result_status: resultStatus,
        error_message: errorMessage,
        user_correction: userCorrection,
        business_context: businessContext
      });

    if (error) {
      console.error('[Interaction Logger] Failed to log:', error);
    }
  } catch (e) {
    console.error('[Interaction Logger] Error:', e);
  }
}

export async function logVisualCorrection({
  userId,
  sessionId,
  actionAttempted,
  correctionType,
  userFeedback,
  metadata
}: {
  userId: string;
  sessionId?: string;
  actionAttempted: string;
  correctionType: 'click_shown' | 'type_shown' | 'navigate_shown' | 'other';
  userFeedback?: string;
  metadata?: any;
}) {
  try {
    const { error } = await supabase
      .from('visual_learning_events')
      .insert({
        user_id: userId,
        session_id: sessionId,
        action_attempted: actionAttempted,
        correction_type: correctionType,
        user_feedback: userFeedback,
        metadata
      });

    if (error) {
      console.error('[Visual Logger] Failed to log:', error);
    }
  } catch (e) {
    console.error('[Visual Logger] Error:', e);
  }
}

export async function getInteractionStats(userId: string, days: number = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('ai_interaction_log')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const total = data?.length || 0;
    const successful = data?.filter(i => i.result_status === 'success').length || 0;
    const failed = data?.filter(i => i.result_status === 'failure').length || 0;

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(1) : '0',
      recentInteractions: data
    };
  } catch (e) {
    console.error('[Interaction Stats] Error:', e);
    return null;
  }
}
