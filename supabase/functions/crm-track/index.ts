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

async function writeOutbox(supabase: any, topic: string, payload: any) {
  const { error } = await supabase.from("outbox").insert({ topic, payload });
  if (error) throw error;
}

async function resolveContact(supabase: any, businessId: string, hint?: ContactHint) {
  if (!hint) return { contactId: null as string | null, changed: false };

  const wantedEmail = normEmail(hint.email);
  const wantedPhone = normPhone(hint.phone);
  const wantedExt = normExtId(hint.externalId);

  // If contact id supplied, verify it belongs to this business
  if (hint.id) {
    const { data: existing, error } = await supabase
      .from("crm_contacts")
      .select("id,name,email,phone")
      .eq("id", hint.id)
      .eq("business_id", businessId)
      .maybeSingle();
    
    if (error) throw error;
    if (existing) {
      // Upsert identities to link future lookups
      if (wantedEmail) {
        await supabase.from("contact_identities")
          .upsert({ contact_id: existing.id, type: "email", value: wantedEmail });
      }
      if (wantedPhone) {
        await supabase.from("contact_identities")
          .upsert({ contact_id: existing.id, type: "phone", value: wantedPhone });
      }
      if (wantedExt) {
        await supabase.from("contact_identities")
          .upsert({ contact_id: existing.id, type: "external_id", value: wantedExt });
      }

      // Merge new name or email/phone if empty
      let changed = false;
      const patch: any = {};
      if (hint.name && hint.name !== existing.name) { 
        patch.name = hint.name; 
        changed = true; 
      }
      if (wantedEmail && !existing.email) { 
        patch.email = wantedEmail; 
        changed = true; 
      }
      if (wantedPhone && !existing.phone) { 
        patch.phone = wantedPhone; 
        changed = true; 
      }
      
      if (changed) {
        const { error: upErr } = await supabase
          .from("crm_contacts")
          .update(patch)
          .eq("id", existing.id);
        if (upErr) throw upErr;
      }
      return { contactId: existing.id as string, changed };
    }
  }

  // Try by identity (external_id first, then email, then phone)
  if (wantedExt) {
    const { data: idRow } = await supabase
      .from("contact_identities")
      .select("contact_id")
      .eq("type", "external_id")
      .eq("value", wantedExt)
      .maybeSingle();
    if (idRow?.contact_id) return { contactId: idRow.contact_id as string, changed: false };
  }
  
  if (wantedEmail) {
    const { data: idRow } = await supabase
      .from("contact_identities")
      .select("contact_id")
      .eq("type", "email")
      .eq("value", wantedEmail)
      .maybeSingle();
    if (idRow?.contact_id) return { contactId: idRow.contact_id as string, changed: false };
  }
  
  if (wantedPhone) {
    const { data: idRow } = await supabase
      .from("contact_identities")
      .select("contact_id")
      .eq("type", "phone")
      .eq("value", wantedPhone)
      .maybeSingle();
    if (idRow?.contact_id) return { contactId: idRow.contact_id as string, changed: false };
  }

  // Try legacy crm_contacts email
  if (wantedEmail) {
    const { data: existing } = await supabase
      .from("crm_contacts")
      .select("id")
      .eq("business_id", businessId)
      .ilike("email", wantedEmail)
      .maybeSingle();
    
    if (existing?.id) {
      // Backfill identity link
      await supabase.from("contact_identities")
        .upsert({ contact_id: existing.id, type: "email", value: wantedEmail });
      if (wantedPhone) {
        await supabase.from("contact_identities")
          .upsert({ contact_id: existing.id, type: "phone", value: wantedPhone });
      }
      if (wantedExt) {
        await supabase.from("contact_identities")
          .upsert({ contact_id: existing.id, type: "external_id", value: wantedExt });
      }
      return { contactId: existing.id as string, changed: false };
    }
  }

  // Create new contact
  const { data: created, error: cErr } = await supabase
    .from("crm_contacts")
    .insert({ 
      business_id: businessId,
      name: hint.name ?? "Unknown",
      email: wantedEmail ?? null, 
      phone: wantedPhone ?? null,
      status: 'lead'
    })
    .select("id")
    .single();
  
  if (cErr) throw cErr;

  // Link identities
  if (wantedEmail) {
    await supabase.from("contact_identities")
      .upsert({ contact_id: created.id, type: "email", value: wantedEmail });
  }
  if (wantedPhone) {
    await supabase.from("contact_identities")
      .upsert({ contact_id: created.id, type: "phone", value: wantedPhone });
  }
  if (wantedExt) {
    await supabase.from("contact_identities")
      .upsert({ contact_id: created.id, type: "external_id", value: wantedExt });
  }

  return { contactId: created.id as string, changed: true };
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

    // Validate props is an object
    if (payload.props && typeof payload.props !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid props: must be an object' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Idempotency check
    const idemKey = req.headers.get('idempotency-key');
    if (idemKey) {
      const { data: seen } = await supabase
        .from('crm_events')
        .select('id')
        .eq('source', 'web')
        .eq('props->>idemKey', idemKey)
        .limit(1);
      
      if (seen && seen.length) {
        return new Response(
          JSON.stringify({ ok: true, idempotent: true }), 
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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

    // Normalize identities for atomic resolution
    const wantedEmail = normEmail(payload.contact?.email);
    const wantedPhone = normPhone(payload.contact?.phone);
    const wantedExt = normExtId(payload.contact?.externalId);

    // Atomic contact resolution via RPC (advisory locks prevent races)
    const { data: rpc, error: resolveError } = await supabase.rpc('app.resolve_contact', {
      p_business: businessId,
      p_email: wantedEmail ?? null,
      p_phone: wantedPhone ?? null,
      p_ext_id: wantedExt ?? null,
      p_name: payload.contact?.name ?? null,
    });

    if (resolveError) {
      log('error', 'crm_track_contact_resolve_failed', { 
        code: resolveError.code,
        msg: resolveError.message 
      });
      return new Response(
        JSON.stringify({ error: 'Contact resolution failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contactId = (rpc as any)?.contact_id as string | null;
    const changed = Boolean((rpc as any)?.changed);

    // Write event with contact_id
    const eventProps = { 
      ...(payload.props ?? {}), 
      ...(idemKey ? { idemKey } : {}) 
    };
    
    const { error: insertError } = await supabase
      .from('crm_events')
      .insert({
        type: payload.type,
        props: eventProps,
        anonymous_id: payload.anonymousId || null,
        contact_hint: payload.contact || null,
        contact_id: contactId || null,
        ts: new Date().toISOString(),
        source: 'web',
      });

    if (insertError) {
      log('error', 'event_insert_failed', { 
        code: insertError.code, 
        msg: insertError.message 
      });
      return new Response(
        JSON.stringify({ error: 'Failed to track event' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Emit contact.updated.v1 to outbox if contact was created/modified
    if (changed && contactId) {
      const evt = {
        type: "contact.updated.v1",
        occurred_at: new Date().toISOString(),
        data: { contact_id: contactId, sources: payload.contact, business_id: businessId }
      };
      
      // Enqueue for publish (Kafka/Redpanda later)
      const { error: outErr } = await supabase
        .from('outbox')
        .insert({ topic: 'contact.updated.v1', payload: evt });
      
      if (outErr) {
        log('error', 'outbox_enqueue_failed', { 
          code: outErr.code, 
          msg: outErr.message 
        });
      }
    }

    log('info', 'event_tracked', { 
      type: payload.type, 
      contactLinked: Boolean(contactId) 
    });

    return new Response(
      JSON.stringify({ ok: true, contactId }),
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