import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Aggregate Learnings Function
 * 
 * Periodically aggregates user patterns into global patterns
 * and calculates analytics for all users
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('[Aggregate] Starting aggregation job...');

    // 1. Aggregate all user patterns into global patterns
    const { error: aggError } = await supabaseClient.rpc('aggregate_user_patterns');
    if (aggError) {
      console.error('[Aggregate] Error aggregating patterns:', aggError);
      throw aggError;
    }
    console.log('[Aggregate] Patterns aggregated successfully');

    // 2. Get all active users (who have interacted in last 30 days)
    const { data: activeUsers, error: usersError } = await supabaseClient
      .from('ai_user_memory')
      .select('user_id')
      .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (usersError) {
      console.error('[Aggregate] Error fetching users:', usersError);
      throw usersError;
    }

    const uniqueUserIds = [...new Set(activeUsers?.map(u => u.user_id) || [])];
    console.log(`[Aggregate] Calculating analytics for ${uniqueUserIds.length} users`);

    // 3. Calculate analytics for each user
    let successCount = 0;
    let errorCount = 0;

    for (const userId of uniqueUserIds) {
      try {
        await supabaseClient.rpc('calculate_user_percentiles', {
          target_user_id: userId
        });
        successCount++;
      } catch (err) {
        console.error(`[Aggregate] Error for user ${userId}:`, err);
        errorCount++;
      }
    }

    console.log(`[Aggregate] Completed: ${successCount} success, ${errorCount} errors`);

    // 4. Promote high-confidence user patterns to global knowledge
    const { data: highConfidencePatterns } = await supabaseClient
      .from('ai_global_patterns')
      .select('*')
      .gte('user_count', 5)
      .gte('success_rate', 0.8);

    if (highConfidencePatterns && highConfidencePatterns.length > 0) {
      console.log(`[Aggregate] Found ${highConfidencePatterns.length} patterns to promote to global knowledge`);
      
      for (const pattern of highConfidencePatterns) {
        // Check if already in global knowledge
        const { data: existing } = await supabaseClient
          .from('ai_global_knowledge')
          .select('id')
          .eq('key', pattern.pattern_key)
          .maybeSingle();

        if (!existing) {
          await supabaseClient.from('ai_global_knowledge').insert({
            tenant_id: '00000000-0000-0000-0000-000000000000',
            key: pattern.pattern_key,
            type: pattern.pattern_type,
            value: {
              pattern: pattern.pattern_key,
              success_rate: pattern.success_rate,
              user_count: pattern.user_count,
              promoted_from: 'cross_user_analysis'
            },
            confidence: pattern.success_rate,
            source: 'aggregation',
            tags: ['cross_user', 'promoted', pattern.pattern_type]
          });
          console.log(`[Aggregate] Promoted pattern to global knowledge: ${pattern.pattern_key}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          patterns_aggregated: true,
          users_analyzed: successCount,
          errors: errorCount,
          patterns_promoted: highConfidencePatterns?.length || 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in aggregate-learnings:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});