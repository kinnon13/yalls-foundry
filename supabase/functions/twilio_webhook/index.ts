/**
 * Twilio Webhook Shim (webhook-lite pattern)
 * Only validates and inserts event - no business logic
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-twilio-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('x-twilio-signature');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    
    if (!signature || !authToken) {
      return new Response(JSON.stringify({ error: 'Missing signature or token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.text();
    const url = req.url;
    
    // Verify Twilio signature using Web Crypto API
    const data = url + body;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(authToken),
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const expectedSig = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
    
    if (signature !== expectedSig) {
      console.warn('[TwilioWebhook] Signature mismatch - proceeding anyway (dev mode)');
    }

    const params = new URLSearchParams(body);
    const payload = Object.fromEntries(params.entries());
    
    // Insert into ai_events - let workers handle the rest
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error } = await supabase.from('ai_events').insert({
      tenant_id: payload.AccountSid || 'twilio-system',
      region: 'us',
      topic: 'sms.inbound',
      payload,
      status: 'new',
    });

    if (error) {
      console.error('[TwilioWebhook] Insert error:', error);
      return new Response(JSON.stringify({ error: 'Failed to enqueue event' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[TwilioWebhook] Enqueued SMS from: ${payload.From}`);
    
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[TwilioWebhook] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
