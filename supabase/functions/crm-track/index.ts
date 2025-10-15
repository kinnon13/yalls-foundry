/**
 * Event Tracking API - CRM Intake Endpoint
 * 
 * Minimal event ingestion with identity resolution hints.
 * Rate-limited and tenant-isolated.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withRateLimit, RateLimits } from '../_shared/rate-limit-wrapper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventPayload {
  type: string;
  anonymousId?: string;
  contact?: {
    id?: string;
    email?: string;
    phone?: string;
  };
  props?: Record<string, any>;
}

async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: EventPayload = await req.json();
    
    // Validate required fields
    if (!body.type || typeof body.type !== 'string' || body.type.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid event type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store event (tenant_id comes from JWT via RLS)
    const { error } = await supabase
      .from('crm_events')
      .insert({
        type: body.type,
        props: body.props ?? {},
        anonymous_id: body.anonymousId ?? null,
        contact_hint: body.contact ?? null,
        source: 'web',
        ts: new Date().toISOString()
      });

    if (error) {
      console.error('[Track] Insert error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to store event' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Track] Event ingested: ${body.type} for user ${user.id.substring(0, 8)}`);

    // TODO Phase 2: Trigger automation.evaluate worker
    
    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Track] Handler error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

Deno.serve(async (req) => {
  const limited = await withRateLimit(req, 'crm-track', RateLimits.standard);
  if (limited) return limited;
  return handler(req);
});
