/**
 * CRM Event Intake (Phase 2 Kickoff)
 * 
 * Rate-limited, tenant-isolated event ingestion for CRM workflows.
 * Future: Identity resolution, automation triggers, segment updates.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { withRateLimit, RateLimits } from '../_shared/rate-limit-wrapper.ts';

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

  // Apply rate limiting
  const limited = await withRateLimit(req, 'crm-track', RateLimits.standard);
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
      console.error('Failed to insert event:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to track event' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Event tracked:', { type: payload.type, userId: user.id });

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('CRM track error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});