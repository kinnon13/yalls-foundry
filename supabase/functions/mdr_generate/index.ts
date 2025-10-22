/**
 * MDR Generate Perspectives
 * Creates multiple reasoning perspectives for a given task
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

    const { taskId, tenantId, context } = await req.json();

    // Generate 3 perspectives: cost-optimized, speed-optimized, quality-optimized
    const perspectives = [
      {
        tenant_id: tenantId,
        task_id: taskId,
        perspective_name: 'cost_optimized',
        approach: 'Minimize resource usage and API calls',
        rationale: 'Focus on efficiency and low cost',
        confidence_score: 85,
      },
      {
        tenant_id: tenantId,
        task_id: taskId,
        perspective_name: 'speed_optimized',
        approach: 'Parallel execution with caching',
        rationale: 'Prioritize fast completion time',
        confidence_score: 80,
      },
      {
        tenant_id: tenantId,
        task_id: taskId,
        perspective_name: 'quality_optimized',
        approach: 'Multi-step validation with redundancy',
        rationale: 'Ensure highest accuracy and reliability',
        confidence_score: 90,
      },
    ];

    const { data: inserted, error } = await supabase
      .from('ai_perspectives')
      .insert(perspectives)
      .select();

    if (error) throw error;

    // Generate plan candidates for each perspective
    for (const persp of inserted || []) {
      await supabase.from('ai_plan_candidates').insert({
        tenant_id: tenantId,
        task_id: taskId,
        perspective_id: persp.id,
        plan_description: `${persp.approach} - ${persp.rationale}`,
        steps: {
          steps: [
            { order: 1, action: 'analyze_context', estimated_ms: 1000 },
            { order: 2, action: 'generate_solution', estimated_ms: 2000 },
            { order: 3, action: 'validate_output', estimated_ms: 1000 },
          ],
        },
        estimated_cost_cents: persp.perspective_name === 'cost_optimized' ? 5 : 15,
        estimated_duration_ms: persp.perspective_name === 'speed_optimized' ? 2000 : 5000,
        risk_score: persp.perspective_name === 'quality_optimized' ? 10 : 30,
      });
    }

    console.log(`[MDR Generate] Created ${inserted?.length} perspectives for ${taskId}`);

    return new Response(JSON.stringify({ 
      perspectives: inserted?.length,
      taskId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[MDR Generate] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
