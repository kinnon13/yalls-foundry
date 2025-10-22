/**
 * Watchdog Tick
 * Monitors worker health and DLQ
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STALE_THRESHOLD_MS = 60000; // 60 seconds
const DLQ_THRESHOLD = 100;

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
    const staleTime = new Date(now.getTime() - STALE_THRESHOLD_MS);

    // Check for stale worker heartbeats
    const { data: staleWorkers, error: hbError } = await supabase
      .from('ai_worker_heartbeats')
      .select('*')
      .lt('last_beat', staleTime.toISOString());

    if (hbError) throw hbError;

    // Create incidents for stale workers
    for (const worker of staleWorkers || []) {
      await supabase.from('ai_incidents').insert({
        tenant_id: null,
        severity: 'high',
        source: 'watchdog',
        summary: `Worker ${worker.worker_id} stale (last beat: ${worker.last_beat})`,
        detail: { worker },
      });

      // Enqueue probe event
      await supabase.from('ai_events').insert({
        tenant_id: null,
        region: worker.region || 'us',
        topic: 'ops.incident_probe',
        payload: { worker_id: worker.worker_id },
        status: 'new',
      });
    }

    // Check DLQ size
    const { count: dlqCount, error: dlqError } = await supabase
      .from('ai_job_dlq')
      .select('*', { count: 'exact', head: true });

    if (dlqError) throw dlqError;

    if ((dlqCount || 0) > DLQ_THRESHOLD) {
      await supabase.from('ai_incidents').insert({
        tenant_id: null,
        severity: 'medium',
        source: 'watchdog',
        summary: `DLQ overflow: ${dlqCount} failed jobs`,
        detail: { dlq_count: dlqCount, threshold: DLQ_THRESHOLD },
      });
    }

    console.log(`[Watchdog] Checked: ${staleWorkers?.length || 0} stale workers, DLQ: ${dlqCount || 0}`);

    return new Response(JSON.stringify({ 
      stale_workers: staleWorkers?.length || 0,
      dlq_count: dlqCount || 0,
      incidents_created: staleWorkers?.length || 0,
      timestamp: now.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Watchdog] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
