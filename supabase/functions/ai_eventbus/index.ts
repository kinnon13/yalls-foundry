/**
 * AI Event Bus Edge Function
 * Accepts and enqueues AI events for worker processing
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventPayload {
  topic: string;
  payload: Record<string, any>;
  tenantId: string;
  region?: string;
  idempotencyKey?: string;
  maxAttempts?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const eventData: EventPayload = await req.json();

    // Validate payload
    if (!eventData.topic || !eventData.payload || !eventData.tenantId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: topic, payload, tenantId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert event
    const { data, error } = await supabase
      .from('ai_events')
      .insert({
        tenant_id: eventData.tenantId,
        region: eventData.region || 'us-west',
        topic: eventData.topic,
        payload: eventData.payload,
        idempotency_key: eventData.idempotencyKey,
        max_attempts: eventData.maxAttempts || 3,
        status: 'pending',
      })
      .select('id, status')
      .single();

    if (error) {
      // Check for duplicate idempotency key
      if (error.code === '23505' && eventData.idempotencyKey) {
        const { data: existing } = await supabase
          .from('ai_events')
          .select('id, status')
          .eq('idempotency_key', eventData.idempotencyKey)
          .single();

        if (existing) {
          return new Response(
            JSON.stringify({
              id: existing.id,
              status: existing.status,
              duplicate: true,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }

      console.error('[EventBus] Insert error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to enqueue event' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[EventBus] Enqueued event: ${data.id} (topic: ${eventData.topic})`);

    return new Response(
      JSON.stringify({
        id: data.id,
        status: data.status,
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[EventBus] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
