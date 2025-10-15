/**
 * Outbox Drain Worker
 * 
 * Claims a batch of undelivered events via SQL RPC to prevent double delivery.
 * Marks events as delivered after processing (future: publish to Kafka/Redpanda).
 * Schedule: Run every minute via cron.
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

    // Generate unique claim token
    const token = crypto.randomUUID();

    // Claim a batch of undelivered events atomically
    const { data: batch, error: claimError } = await supabase.rpc('app.outbox_claim', {
      p_limit: 100,
      p_token: token,
    });

    if (claimError) {
      log('error', 'outbox_claim_failed', { 
        code: claimError.code, 
        msg: claimError.message 
      });
      return new Response(
        JSON.stringify({ error: 'Failed to claim outbox batch' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    let failed = 0;

    for (const r of (batch ?? []) as any[]) {
      try {
        // TODO: Future - send to Kafka/Redpanda
        // await kafkaProduce(r.topic, r.payload)
        
        // Mark as delivered only if we still hold the claim
        const { error: upErr } = await supabase
          .from('outbox')
          .update({ 
            delivered_at: new Date().toISOString(), 
            attempts: (r.attempts ?? 0) + 1,
            processing_token: null
          })
          .eq('id', r.id)
          .eq('processing_token', token);

        if (upErr) throw upErr;
        processed++;
      } catch (err) {
        failed++;
        log('error', 'outbox_delivery_failed', { 
          id: r.id, 
          topic: r.topic, 
          attempts: (r.attempts ?? 0) + 1,
          msg: err instanceof Error ? err.message : 'unknown'
        });

        // Release claim but increment attempts
        await supabase
          .from('outbox')
          .update({ 
            attempts: (r.attempts ?? 0) + 1,
            processing_token: null
          })
          .eq('id', r.id)
          .eq('processing_token', token);
      }
    }

    log('info', 'outbox_drain_complete', { 
      processed, 
      failed, 
      total: (batch ?? []).length 
    });

    return new Response(
      JSON.stringify({ 
        ok: true, 
        processed, 
        failed,
        total: (batch ?? []).length 
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
