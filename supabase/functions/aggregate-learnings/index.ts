import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { withRateLimit } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GLOBAL_TENANT = '00000000-0000-0000-0000-000000000000';

/**
 * Aggregate Learnings Function
 * 
 * Periodically aggregates user patterns into global patterns
 * and calculates analytics for all users
 */
serve(async (req) => {
  const log = createLogger('aggregate-learnings');
  log.startTimer();
  
  // Rate limiting for admin function
  const limited = await withRateLimit(req, 'aggregate-learnings', { burst: 50, perMin: 500 });
  if (limited) return limited;
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    log.info('Starting aggregation job');

    // 1. Aggregate all user patterns into global patterns
    const { error: aggError } = await supabaseClient.rpc('aggregate_user_patterns');
    if (aggError) {
      log.error('Error aggregating patterns', aggError);
      throw aggError;
    }
    log.info('Patterns aggregated successfully');

    // 2. Get all active users (who have interacted in last 30 days)
    const { data: activeUsers, error: usersError } = await supabaseClient
      .from('ai_user_memory')
      .select('user_id')
      .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (usersError) {
      log.error('Error fetching users', usersError);
      throw usersError;
    }

    const uniqueUserIds = [...new Set(activeUsers?.map(u => u.user_id) || [])];
    log.info('Calculating analytics', { user_count: uniqueUserIds.length });

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
        log.error('Error calculating user analytics', err, { user_id: userId });
        errorCount++;
      }
    }

    log.info('Analytics calculation complete', { success: successCount, errors: errorCount });

    // 4. Promote high-confidence user patterns to global knowledge
    const { data: highConfidencePatterns } = await supabaseClient
      .from('ai_global_patterns')
      .select('*')
      .gte('user_count', 5)
      .gte('success_rate', 0.8);

    if (highConfidencePatterns && highConfidencePatterns.length > 0) {
      log.info('Promoting high-confidence patterns', { count: highConfidencePatterns.length });
      
      for (const pattern of highConfidencePatterns) {
        // Check if already in global knowledge
        const { data: existing } = await supabaseClient
          .from('ai_global_knowledge')
          .select('id')
          .eq('key', pattern.pattern_key)
          .maybeSingle();

        if (!existing) {
          await supabaseClient.from('ai_global_knowledge').insert({
            tenant_id: GLOBAL_TENANT,
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
          log.info('Pattern promoted to global knowledge', { pattern_key: pattern.pattern_key });
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
    log.error('Aggregation failed', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});