/**
 * Fine-Tune Cohort Worker
 * Analyzes user feedback by cohort and proposes model fine-tuning adjustments
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CohortMetrics {
  cohort_name: string;
  user_count: number;
  avg_rating: number;
  total_interactions: number;
  success_rate: number;
  needs_tuning: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Define cohorts (can be expanded)
    const cohorts = [
      { name: 'high_activity', query: 'proactivity_level = \'high\'' },
      { name: 'medium_activity', query: 'proactivity_level = \'medium\'' },
      { name: 'low_activity', query: 'proactivity_level = \'low\'' },
      { name: 'heavy_mode', query: 'pathway_mode = \'heavy\'' },
      { name: 'light_mode', query: 'pathway_mode = \'light\'' },
    ];

    const cohortMetrics: CohortMetrics[] = [];

    for (const cohort of cohorts) {
      // Get users in cohort
      const { data: cohortUsers } = await supabase
        .from('ai_user_profiles')
        .select('user_id')
        .or(cohort.query)
        .limit(1000);

      if (!cohortUsers || cohortUsers.length === 0) continue;

      const userIds = cohortUsers.map(u => u.user_id);

      // Get feedback for these users
      const { data: feedback } = await supabase
        .from('ai_feedback')
        .select('rating, metadata')
        .in('user_id', userIds)
        .gte('created_at', thirtyDaysAgo);

      const ratings = (feedback || [])
        .map(f => f.rating)
        .filter(r => r !== null && r !== undefined);

      const avgRating = ratings.length > 0 
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
        : 0;

      const successRate = ratings.filter(r => r >= 4).length / (ratings.length || 1);

      const metrics: CohortMetrics = {
        cohort_name: cohort.name,
        user_count: cohortUsers.length,
        avg_rating: avgRating,
        total_interactions: feedback?.length || 0,
        success_rate: successRate,
        needs_tuning: avgRating < 3.5 || successRate < 0.6
      };

      cohortMetrics.push(metrics);

      // If cohort needs tuning, create proposal
      if (metrics.needs_tuning && metrics.total_interactions > 10) {
        await supabase.from('ai_change_proposals').insert({
          tenant_id: null,
          topic: 'fine_tune.cohort',
          dry_run: {
            cohort: cohort.name,
            current_avg: avgRating,
            current_success: successRate,
            sample_size: metrics.total_interactions
          },
          status: 'proposed',
          risk_score: 15,
        });

        console.log(`[Fine-Tune] Proposed tuning for cohort: ${cohort.name} (avg: ${avgRating.toFixed(2)}, success: ${(successRate * 100).toFixed(1)}%)`);
      }
    }

    // Log cohort analysis
    await supabase.from('ai_action_ledger').insert({
      tenant_id: null,
      topic: 'fine_tune.cohort_analysis',
      payload: {
        date: new Date().toISOString(),
        cohorts: cohortMetrics.length,
        needs_tuning: cohortMetrics.filter(c => c.needs_tuning).length,
        metrics: cohortMetrics
      }
    });

    return new Response(JSON.stringify({ 
      ok: true, 
      cohorts: cohortMetrics.length,
      needs_tuning: cohortMetrics.filter(c => c.needs_tuning).length,
      metrics: cohortMetrics
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Fine-Tune] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
