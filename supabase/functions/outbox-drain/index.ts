/**
 * Outbox Drain Worker
 * 
 * Claims a batch of undelivered events via SQL RPC to prevent double delivery.
 * Marks events as delivered after processing (future: publish to Kafka/Redpanda).
 * Schedule: Run every minute via cron.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { withRateLimit, RateLimits } from '../_shared/rate-limit-wrapper.ts';

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

  // Apply rate limiting (admin-level since this is a worker endpoint)
  const limited = await withRateLimit(req, 'outbox-drain', RateLimits.admin);
  if (limited) return limited;

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
      p_tenant: null, // null = all tenants
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

    const total = (batch ?? []).length;
    if (total === 0) {
      log('info', 'outbox_drain_complete', { processed: 0, total: 0 });
      return new Response(
        JSON.stringify({ ok: true, processed: 0, total: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Collect IDs for batched finalization
    const ids = (batch as any[]).map(r => r.id);

    // TODO: Future - send to Kafka/Redpanda
    // await kafkaProduceMany(batch.map(r => ({ topic: r.topic, payload: r.payload })));

    // Batched finalization: mark all delivered in one RPC call
    const { data: delivered, error: markError } = await supabase.rpc('app.outbox_mark_delivered', {
      p_token: token,
      p_ids: ids,
    });

    if (markError) {
      log('error', 'outbox_mark_delivered_failed', { 
        code: markError.code, 
        msg: markError.message 
      });
      return new Response(
        JSON.stringify({ error: 'Failed to mark delivered' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const processed = delivered ?? 0;
    log('info', 'outbox_drain_complete', { processed, total });

    return new Response(
      JSON.stringify({ ok: true, processed, total }),
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
