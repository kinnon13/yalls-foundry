/**
 * MDR Consensus Builder
 * Evaluates plan candidates and selects optimal approach
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { taskId, tenantId } = await req.json();

    // Fetch all candidates for this task
    const { data: candidates, error } = await supabase
      .from('ai_plan_candidates')
      .select('*')
      .eq('task_id', taskId)
      .eq('tenant_id', tenantId);

    if (error) throw error;

    if (!candidates || candidates.length === 0) {
      throw new Error('No plan candidates found');
    }

    // Score each candidate (lower risk + lower cost = better)
    const scored = candidates.map(c => ({
      ...c,
      score: 100 - (c.risk_score * 0.6 + (c.estimated_cost_cents / 20) * 0.4),
    }));

    // Select best plan
    const best = scored.sort((a, b) => b.score - a.score)[0];

    // Create consensus record
    const { data: consensus, error: consensusError } = await supabase
      .from('ai_consensus')
      .insert({
        tenant_id: tenantId,
        task_id: taskId,
        chosen_plan_id: best.id,
        confidence: Math.min(95, Math.round(best.score)),
        reasoning: `Selected based on optimal balance of risk (${best.risk_score}), cost (${best.estimated_cost_cents}¢), and duration.`,
        alternatives: scored.slice(1, 3).map(s => ({
          id: s.id,
          score: Math.round(s.score),
        })),
      })
      .select()
      .single();

    if (consensusError) throw consensusError;

    console.log(`[MDR Consensus] Selected plan ${best.id} for ${taskId} (confidence: ${consensus.confidence})`);

    return new Response(JSON.stringify({ 
      consensus,
      chosenPlan: best 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[MDR Consensus] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
