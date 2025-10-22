/**
 * Cron Tick Scheduler
 * Runs due cron jobs with jitter
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

    // Find due cron jobs
    const { data: dueJobs, error } = await supabase
      .from('ai_cron_jobs')
      .select('*')
      .lte('next_run_at', now.toISOString())
      .eq('enabled', true);

    if (error) throw error;

    let processed = 0;

    for (const job of dueJobs || []) {
      // Enqueue the job as an event
      await supabase.from('ai_events').insert({
        tenant_id: job.tenant_id || null,
        region: job.region || 'us',
        topic: job.topic,
        payload: job.payload || {},
        status: 'new',
      });

      // Calculate next run with jitter
      const jitterMs = (job.jitter_sec || 0) * 1000 * Math.random();
      const nextRun = new Date(now.getTime() + parseSchedule(job.schedule) + jitterMs);

      // Update next run time
      await supabase
        .from('ai_cron_jobs')
        .update({
          next_run_at: nextRun.toISOString(),
          last_run_at: now.toISOString(),
        })
        .eq('id', job.id);

      processed++;
    }

    console.log(`[CronTick] Processed ${processed} due jobs`);

    return new Response(JSON.stringify({ 
      processed,
      timestamp: now.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[CronTick] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Helper to parse cron schedule (simplified)
  function parseSchedule(schedule: string): number {
    // For now, default to 60 seconds
    // TODO: Implement proper cron parsing
    return 60000;
  }
});
