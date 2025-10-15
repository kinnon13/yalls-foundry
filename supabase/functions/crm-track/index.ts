/**
 * CRM Event Intake (Phase 2 Kickoff)
 * 
 * Rate-limited, tenant-isolated event ingestion for CRM workflows.
 * Future: Identity resolution, automation triggers, segment updates.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { withRateLimit, RateLimits, getTenantFromJWT } from '../_shared/rate-limit-wrapper.ts';

// PII-safe structured logger
function log(level: 'info' | 'error', msg: string, fields?: Record<string, unknown>) {
  const payload = { lvl: level, msg, ts: new Date().toISOString(), ...fields };
  console[level](JSON.stringify(payload));
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackEventPayload {
  type: string;
  anonymousId?: string;
  contact?: {
    id?: string;
    email?: string;
    phone?: string;
  };
  props?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply tenant-aware rate limiting
  const tenantId = getTenantFromJWT(req);
  const limited = await withRateLimit(req, 'crm-track', { ...RateLimits.standard, tenantId });
  if (limited) return limited;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate payload
    const payload: TrackEventPayload = await req.json();
    
    if (!payload.type || typeof payload.type !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid event type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store event (tenant_id auto-injected via RLS)
    const { error: insertError } = await supabase
      .from('crm_events')
      .insert({
        type: payload.type,
        props: payload.props || {},
        anonymous_id: payload.anonymousId || null,
        contact_hint: payload.contact || null,
        ts: new Date().toISOString(),
        source: 'web',
      });

    if (insertError) {
      log('error', 'event_insert_failed', { code: insertError.code, msg: insertError.message });
      return new Response(
        JSON.stringify({ error: 'Failed to track event' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log('info', 'event_tracked', { type: payload.type });

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    log('error', 'crm_track_error', { msg: error instanceof Error ? error.message : 'unknown' });
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});