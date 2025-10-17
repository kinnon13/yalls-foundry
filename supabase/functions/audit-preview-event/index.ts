import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Audit preview interactions and blocked write attempts
 * Parent calls this (not preview child) to log events server-side
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Service role for audit writes
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const { event_type, source, payload, user_agent, route } = await req.json();

    // Validate required fields
    if (!event_type || !source) {
      return new Response('Missing required fields', { status: 400, headers: corsHeaders });
    }

    // Hash payload for privacy (don't store sensitive data)
    const payloadStr = JSON.stringify(payload || {});
    const payloadHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(payloadStr)
    );
    const hashHex = Array.from(new Uint8Array(payloadHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Log audit event (using service role to bypass RLS)
    const { error: insertError } = await supabase
      .from('preview_audit_log')
      .insert({
        user_id: user.id,
        event_type,
        source,
        payload_hash: hashHex,
        user_agent: user_agent || req.headers.get('user-agent'),
        route: route || '',
        ip_address: req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown',
      });

    if (insertError) {
      console.error('Audit insert failed:', insertError);
      return new Response('Audit log failed', { status: 500, headers: corsHeaders });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Audit error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
