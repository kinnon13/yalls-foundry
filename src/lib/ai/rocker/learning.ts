/**
 * Rocker Learning System
 * 
 * Manages self-improvement through feedback loops.
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Record user correction to improve future responses
 */
export async function recordCorrection(
  originalAction: string,
  correction: string,
  userId: string
) {
  try {
    // Store as feedback
    await supabase.from('ai_feedback').insert({
      user_id: userId,
      kind: 'user_correction',
      payload: {
        original_action: originalAction,
        correction,
        timestamp: new Date().toISOString()
      }
    });

    // Update hypothesis based on correction
    const hypothesisKey = `correction_${originalAction.toLowerCase().replace(/\s+/g, '_')}`;
    
    const { data: existing } = await supabase
      .from('ai_hypotheses')
      .select('*')
      .eq('user_id', userId)
      .eq('key', hypothesisKey)
      .single();
    
    if (existing) {
      // Boost confidence
      const currentEvidence = Array.isArray(existing.evidence) ? existing.evidence as any[] : [];
      await supabase
        .from('ai_hypotheses')
        .update({
          confidence: Math.min((existing.confidence || 0.5) + 0.15, 1.0),
          value: { correct_approach: correction },
          evidence: [...currentEvidence, { correction, timestamp: new Date().toISOString() }],
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new learning
      await supabase.from('ai_hypotheses').insert({
        tenant_id: '00000000-0000-0000-0000-000000000000',
        user_id: userId,
        key: hypothesisKey,
        value: { correct_approach: correction },
        confidence: 0.8,
        evidence: [{ correction, timestamp: new Date().toISOString() }],
        status: 'active'
      });
    }
  } catch (e) {
    console.error('[Learning] Failed to record correction:', e);
  }
}

/**
 * Check if Rocker should self-critique after repeated failures
 */
export async function shouldSelfCritique(
  action: string,
  userId: string
): Promise<{ should: boolean; failureCount: number; suggestion?: string }> {
  try {
    const { data: recentFailures } = await supabase
      .from('ai_feedback')
      .select('*')
      .eq('user_id', userId)
      .eq('kind', 'dom_failure')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .order('created_at', { ascending: false });
    
    const actionFailures = recentFailures?.filter(f => (f.payload as any)?.action === action) || [];
    
    if (actionFailures.length >= 3) {
      // Repeated failures - suggest alternative
      return {
        should: true,
        failureCount: actionFailures.length,
        suggestion: `I've tried ${actionFailures.length} times to ${action} but it's not working. Let me try a different approach or ask you for help.`
      };
    }
    
    return { should: false, failureCount: actionFailures.length };
  } catch (e) {
    console.error('[Learning] Failed to check critique threshold:', e);
    return { should: false, failureCount: 0 };
  }
}

/**
 * Get success rate for an action type
 */
export async function getActionSuccessRate(
  action: string,
  userId: string
): Promise<{ total: number; successful: number; rate: number }> {
  try {
    const { data: feedback } = await supabase
      .from('ai_feedback')
      .select('*')
      .eq('user_id', userId)
      .in('kind', ['dom_success', 'dom_failure'])
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });
    
    const actionFeedback = feedback?.filter(f => (f.payload as any)?.action === action) || [];
    const total = actionFeedback.length;
    const successful = actionFeedback.filter(f => f.kind === 'dom_success').length;
    
    return {
      total,
      successful,
      rate: total > 0 ? successful / total : 0
    };
  } catch (e) {
    console.error('[Learning] Failed to get success rate:', e);
    return { total: 0, successful: 0, rate: 0 };
  }
}

/**
 * Export learning data for analysis
 */
export async function exportLearningData(userId: string) {
  try {
    const [hypotheses, feedback] = await Promise.all([
      supabase
        .from('ai_hypotheses')
        .select('*')
        .eq('user_id', userId)
        .order('confidence', { ascending: false }),
      supabase
        .from('ai_feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)
    ]);
    
    return {
      hypotheses: hypotheses.data || [],
      feedback: feedback.data || [],
      stats: {
        totalHypotheses: hypotheses.data?.length || 0,
        highConfidence: hypotheses.data?.filter(h => h.confidence >= 0.8).length || 0,
        totalFeedback: feedback.data?.length || 0,
        successCount: feedback.data?.filter(f => f.kind === 'dom_success').length || 0,
        failureCount: feedback.data?.filter(f => f.kind === 'dom_failure').length || 0
      }
    };
  } catch (e) {
    console.error('[Learning] Failed to export data:', e);
    return null;
  }
}
