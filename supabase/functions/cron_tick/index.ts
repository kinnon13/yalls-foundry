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

// Helper to parse cron schedule
function parseSchedule(schedule: string): number {
  // Support "rate(Nm|Ns|Nh)" format
  const match = schedule?.match(/^rate\((\d+)([smh])\)$/i);
  if (!match) return 60000; // default 1 minute
  
  const num = Number(match[1]);
  const unit = match[2].toLowerCase();
  
  if (unit === 's') return num * 1000;
  if (unit === 'm') return num * 60000;
  if (unit === 'h') return num * 3600000;
  
  return 60000;
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
        status: 'pending',
      });

      // Calculate next run with jitter
      const jitterMs = (job.jitter_sec || 0) * 1000 * Math.random();
      const delayMs = parseSchedule(job.schedule);
      const nextRun = new Date(now.getTime() + delayMs + jitterMs);

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
});
