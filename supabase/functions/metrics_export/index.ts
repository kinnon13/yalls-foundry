/**
 * Metrics Export
 * Aggregates job metrics to system_metrics
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

    const now = new Date();
    const oneMinAgo = new Date(now.getTime() - 60000);

    // Aggregate by pool
    const { data: pools, error: poolError } = await supabase
      .from('ai_worker_pools')
      .select('pool');

    if (poolError) throw poolError;

    for (const { pool } of pools || []) {
      // Count jobs by status in last minute
      const { count: completed } = await supabase
        .from('ai_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('pool', pool)
        .eq('status', 'done')
        .gte('updated_at', oneMinAgo.toISOString());

      const { count: failed } = await supabase
        .from('ai_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('pool', pool)
        .eq('status', 'error')
        .gte('updated_at', oneMinAgo.toISOString());

      const { count: queued } = await supabase
        .from('ai_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('pool', pool)
        .eq('status', 'queued');

      // Write to system_metrics
      await supabase.from('system_metrics').insert({
        metric_name: 'jobs.completed',
        metric_value: completed || 0,
        labels: { pool },
        timestamp: now.toISOString(),
      });

      await supabase.from('system_metrics').insert({
        metric_name: 'jobs.failed',
        metric_value: failed || 0,
        labels: { pool },
        timestamp: now.toISOString(),
      });

      await supabase.from('system_metrics').insert({
        metric_name: 'queue.depth',
        metric_value: queued || 0,
        labels: { pool },
        timestamp: now.toISOString(),
      });
    }

    console.log(`[MetricsExport] Exported metrics for ${pools?.length || 0} pools`);

    return new Response(JSON.stringify({ 
      pools_processed: pools?.length || 0,
      timestamp: now.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[MetricsExport] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
