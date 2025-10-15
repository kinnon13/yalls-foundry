/**
 * CRM Event Intake with Identity Resolution (Phase 2)
 * 
 * Rate-limited, tenant-isolated event ingestion with contact identity stitching.
 * Resolves email/phone → canonical contact, emits contact.updated events.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { withRateLimit, RateLimits, getTenantFromJWT } from '../_shared/rate-limit-wrapper.ts';

// PII-safe structured logger
function log(level: 'info' | 'error', msg: string, fields?: Record<string, unknown>) {
  const payload = { lvl: level, msg, ts: new Date().toISOString(), ...fields };
  console[level](JSON.stringify(payload));
}

// Hash sensitive IDs for logging
function hashUserId(userId: string): string {
  return `user_${userId.slice(0, 8)}...`;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
};

type ContactHint = { 
  id?: string; 
  email?: string; 
  phone?: string; 
  name?: string;
  externalId?: string;
};

interface TrackEventPayload {
  type: string;
  anonymousId?: string;
  contact?: ContactHint;
  props?: Record<string, unknown>;
}

// Normalize email, phone, and external ID for identity matching
const normEmail = (s?: string) => (s ? s.trim().toLowerCase() : undefined);
const normPhone = (s?: string) => (s ? s.replace(/[^\d+]/g, "") : undefined);
const normExtId = (s?: string) => (s ? s.trim() : undefined);

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

    // Validate props is an object
    if (payload.props && typeof payload.props !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid props: must be an object' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate business_id ownership
    const requestedBusinessId = payload.props?.business_id as string | undefined;
    if (!requestedBusinessId) {
      return new Response(
        JSON.stringify({ error: 'business_id required in props' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has access to this business (owner or team member)
    const { data: businessAccess, error: accessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', requestedBusinessId)
      .or(`owner_id.eq.${user.id},business_team.user_id.eq.${user.id}`)
      .maybeSingle();

    if (accessError || !businessAccess) {
      log('error', 'crm_track_unauthorized_business', { 
        user: hashUserId(user.id),
        business: requestedBusinessId 
      });
      return new Response(
        JSON.stringify({ error: 'Unauthorized: business_id not accessible' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const businessId = requestedBusinessId;

    // Atomic ingest via single RPC (resolve + insert + emit)
    const idemKey = req.headers.get('idempotency-key') ?? null;
    
    const contactJson = {
      email: normEmail(payload.contact?.email) ?? null,
      phone: normPhone(payload.contact?.phone) ?? null,
      externalId: normExtId(payload.contact?.externalId) ?? null,
      name: payload.contact?.name ?? null,
    };

    const { data: res, error: rpcErr } = await supabase.rpc('app.ingest_event', {
      p_business: businessId,
      p_type: payload.type,
      p_props: payload.props ?? {},
      p_contact: contactJson,
      p_idem_key: idemKey,
    });

    if (rpcErr) {
      log('error', 'ingest_failed', { code: rpcErr.code, msg: rpcErr.message });
      return new Response(
        JSON.stringify({ error: 'Ingest failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log('info', 'crm_event_ingested', { 
      type: payload.type, 
      idempotent: (res as any)?.idempotent 
    });

    return new Response(
      JSON.stringify(res ?? { ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    log('error', 'crm_track_error', { 
      msg: error instanceof Error ? error.message : 'unknown' 
    });
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});