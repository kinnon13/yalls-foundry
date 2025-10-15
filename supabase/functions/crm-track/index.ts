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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
};

type ContactHint = { id?: string; email?: string; phone?: string; name?: string };

interface TrackEventPayload {
  type: string;
  anonymousId?: string;
  contact?: ContactHint;
  props?: Record<string, unknown>;
}

// Normalize email and phone for identity matching
const normEmail = (s?: string) => (s ? s.trim().toLowerCase() : undefined);
const normPhone = (s?: string) => (s ? s.replace(/[^\d+]/g, "") : undefined);

async function resolveContact(supabase: any, businessId: string, hint?: ContactHint) {
  if (!hint) return { contactId: null as string | null, changed: false };

  const wantedEmail = normEmail(hint.email);
  const wantedPhone = normPhone(hint.phone);

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

  // Try by identity (email then phone)
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

    // For now, use user's first business or require business_id in payload
    // TODO: Make business selection more explicit
    const businessId = payload.props?.business_id as string | undefined;
    if (!businessId) {
      return new Response(
        JSON.stringify({ error: 'business_id required in props' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resolve / create contact
    const { contactId, changed } = await resolveContact(supabase, businessId, payload.contact);

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

    // Emit contact.updated if we changed/created anything
    if (changed && contactId) {
      await supabase.from('crm_events').insert({
        type: 'contact.updated',
        props: { 
          reason: 'resolved_from_hint', 
          contact_id: contactId, 
          sources: payload.contact 
        },
        contact_id: contactId,
        source: 'system',
      });
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