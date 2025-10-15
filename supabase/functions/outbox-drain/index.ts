/**
 * Outbox Drain Worker
 * 
 * Polls the outbox table and processes undelivered events.
 * Schedule: Run every minute via cron.
 * Future: Publish to Kafka/Redpanda instead of just marking delivered.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PII-safe structured logger
function log(level: 'info' | 'error', msg: string, fields?: Record<string, unknown>) {
  const payload = { lvl: level, msg, ts: new Date().toISOString(), ...fields };
  console[level](JSON.stringify(payload));
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key to scan across all tenants
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Pull a small batch per run (100 events max)
    const { data: rows, error } = await supabase
      .from('outbox')
      .select('id, tenant_id, topic, payload, attempts')
      .is('delivered_at', null)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      log('error', 'outbox_fetch_failed', { code: error.code, msg: error.message });
      return new Response(
        JSON.stringify({ error: 'Failed to fetch outbox' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    let failed = 0;

    for (const r of rows ?? []) {
      try {
        // TODO: Future - send to Kafka/Redpanda
        // await kafkaProduce(r.topic, r.payload)
        
        // For now, just mark as delivered
        const { error: upErr } = await supabase
          .from('outbox')
          .update({ 
            delivered_at: new Date().toISOString(), 
            attempts: r.attempts + 1 
          })
          .eq('id', r.id)
          .eq('tenant_id', r.tenant_id);

        if (upErr) throw upErr;
        processed++;
      } catch (err) {
        failed++;
        log('error', 'outbox_delivery_failed', { 
          id: r.id, 
          topic: r.topic, 
          attempts: r.attempts + 1,
          msg: err instanceof Error ? err.message : 'unknown'
        });

        // Increment attempts count
        await supabase
          .from('outbox')
          .update({ attempts: r.attempts + 1 })
          .eq('id', r.id)
          .eq('tenant_id', r.tenant_id);
      }
    }

    log('info', 'outbox_drain_complete', { processed, failed, total: rows?.length ?? 0 });

    return new Response(
      JSON.stringify({ 
        ok: true, 
        processed, 
        failed,
        total: rows?.length ?? 0 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    log('error', 'outbox_drain_error', { 
      msg: error instanceof Error ? error.message : 'unknown' 
    });
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
