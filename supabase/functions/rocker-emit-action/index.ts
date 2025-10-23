/**
 * Rocker Emit Action Function
 * Backend endpoint for AI to emit actions to the UI via event bus
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';
import { corsHeaders } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';

const log = createLogger('rocker-emit-action');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action_type, payload, priority, target_user_id } = await req.json();

    if (!action_type || !payload) {
      return new Response(JSON.stringify({ error: 'Missing action_type or payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get tenant_id for proper isolation
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    const tenantId = profile?.tenant_id || user.id;

    // Insert action into ai_proposals for persistence
    const { error: insertError } = await supabaseClient
      .from('ai_proposals')
      .insert({
        type: action_type,
        user_id: target_user_id || user.id,
        tenant_id: tenantId,
        payload,
        due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

    if (insertError) {
      log.error('Failed to insert action', { error: insertError });
      throw insertError;
    }

    // Log to audit trail
    await supabaseClient.from('admin_audit_log').insert({
      action: `rocker.action.${action_type}`,
      actor_user_id: user.id,
      metadata: {
        action_type,
        payload,
        priority,
        target_user_id: target_user_id || user.id,
      },
    });

    log.info('Action emitted', { action_type, priority, user_id: user.id });

    return new Response(
      JSON.stringify({ success: true, action_type, priority }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    log.error('Failed to emit action', { error });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
