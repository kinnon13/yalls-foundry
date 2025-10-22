/**
 * DLQ Replay
 * Replays dead letter queue with backoff
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BACKOFF_WINDOWS = [
  300000,   // 5 min
  900000,   // 15 min
  3600000,  // 1 hour
  14400000, // 4 hours
];

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

    // Find DLQ items ready for retry
    const { data: dlqItems, error } = await supabase
      .from('ai_job_dlq')
      .select('*')
      .lte('retry_after', now.toISOString())
      .limit(50);

    if (error) throw error;

    let replayed = 0;

    for (const item of dlqItems || []) {
      const attempt = item.attempts || 0;

      if (attempt >= BACKOFF_WINDOWS.length) {
        // Max retries exceeded - mark as permanently failed
        await supabase
          .from('ai_job_dlq')
          .update({ status: 'permanent_failure' })
          .eq('id', item.id);
        continue;
      }

      // Re-enqueue as a new job
      const { error: insertError } = await supabase
        .from('ai_jobs')
        .insert({
          tenant_id: item.tenant_id,
          region: item.region,
          pool: item.pool,
          topic: item.topic,
          payload: item.payload,
          status: 'queued',
          attempts: 0,
          max_attempts: item.max_attempts || 3,
        });

      if (insertError) {
        // Failed to requeue - update retry_after
        const nextWindow = BACKOFF_WINDOWS[attempt];
        const nextRetry = new Date(now.getTime() + nextWindow);

        await supabase
          .from('ai_job_dlq')
          .update({
            attempts: attempt + 1,
            retry_after: nextRetry.toISOString(),
          })
          .eq('id', item.id);
      } else {
        // Successfully requeued - remove from DLQ
        await supabase
          .from('ai_job_dlq')
          .delete()
          .eq('id', item.id);

        replayed++;
      }
    }

    console.log(`[DLQReplay] Replayed ${replayed} / ${dlqItems?.length || 0} items`);

    return new Response(JSON.stringify({ 
      replayed,
      total: dlqItems?.length || 0,
      timestamp: now.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[DLQReplay] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
