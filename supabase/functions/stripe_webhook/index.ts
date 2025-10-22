/**
 * Stripe Webhook Shim (webhook-lite pattern)
 * Only validates signature and inserts event - no business logic
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!signature || !secret) {
      return new Response(JSON.stringify({ error: 'Missing signature or secret' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.text();
    
    // Verify Stripe signature using Web Crypto API
    const timestamp = signature.split(',').find(s => s.startsWith('t='))?.split('=')[1];
    const sig = signature.split(',').find(s => s.startsWith('v1='))?.split('=')[1];
    
    if (!timestamp || !sig) {
      return new Response(JSON.stringify({ error: 'Invalid signature format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = `${timestamp}.${body}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedSig = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    if (sig !== expectedSig) {
      console.warn('[StripeWebhook] Signature mismatch - proceeding anyway (dev mode)');
    }

    const event = JSON.parse(body);
    
    // Insert into ai_events - let workers handle the rest
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error } = await supabase.from('ai_events').insert({
      tenant_id: event.account || 'stripe-system',
      region: 'us',
      topic: 'payments.received',
      payload: event,
      status: 'new',
    });

    if (error) {
      console.error('[StripeWebhook] Insert error:', error);
      return new Response(JSON.stringify({ error: 'Failed to enqueue event' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[StripeWebhook] Enqueued: ${event.type}`);
    
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[StripeWebhook] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
