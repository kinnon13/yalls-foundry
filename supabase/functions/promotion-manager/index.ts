import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, ...body } = await req.json();

    // Get tenant
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = profile?.tenant_id || user.id;

    switch (action) {
      case 'propose': {
        const { from_scope, to_scope, source_ref, payload, reason } = body;

        const { data: proposalId } = await supabaseClient.rpc('ai_propose', {
          p_from: from_scope,
          p_to: to_scope,
          p_proposer: user.id,
          p_source: source_ref,
          p_payload: payload,
          p_reason: reason,
          p_tenant: tenantId,
        });

        return new Response(JSON.stringify({ id: proposalId, status: 'pending' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list': {
        const { status } = body;

        // Check if admin
        const { data: isAdmin } = await supabaseClient.rpc('is_admin', {
          _user_id: user.id,
        });

        let query = supabaseClient
          .from('ai_promotion_queue')
          .select(`
            *,
            proposer:proposer_id(display_name),
            approver:approver_id(display_name)
          `)
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });

        if (status) {
          query = query.eq('status', status);
        }

        if (!isAdmin) {
          query = query.eq('proposer_id', user.id);
        }

        const { data: queue } = await query.limit(100);

        return new Response(JSON.stringify({ queue: queue || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'approve': {
        const { id, decision, notes } = body;

        // Verify admin
        const { data: isAdmin } = await supabaseClient.rpc('is_admin', {
          _user_id: user.id,
        });

        if (!isAdmin) {
          return new Response(JSON.stringify({ error: 'Requires admin' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        await supabaseClient.rpc('ai_approve', {
          p_id: id,
          p_admin: user.id,
          p_decision: decision,
          p_notes: notes,
        });

        // If approved, enqueue for application
        if (decision === 'approve') {
          // Could trigger a background job here
          console.log(`Promotion ${id} approved, ready for application`);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'apply': {
        const { id } = body;

        // Verify super admin
        const { data: isSuperAdmin } = await supabaseClient.rpc('is_super_admin', {
          _user_id: user.id,
        });

        if (!isSuperAdmin) {
          return new Response(JSON.stringify({ error: 'Requires super admin' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get the approved promotion
        const { data: promotion } = await supabaseClient
          .from('ai_promotion_queue')
          .select('*')
          .eq('id', id)
          .eq('status', 'approved')
          .single();

        if (!promotion) {
          return new Response(JSON.stringify({ error: 'Promotion not found or not approved' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Apply based on to_scope
        if (promotion.to_scope === 'andy') {
          // Write to global knowledge
          await supabaseClient.from('ai_global_knowledge').upsert({
            topic: promotion.payload.topic || promotion.payload.key,
            summary: promotion.payload.summary || JSON.stringify(promotion.payload.value),
            data: promotion.payload,
            provenance: {
              from: promotion.from_scope,
              source_ref: promotion.source_ref,
              applied_at: new Date().toISOString(),
              applied_by: user.id,
            },
            tenant_id: tenantId,
          });
        } else if (promotion.to_scope === 'admin') {
          // Write to admin-scoped memory
          await supabaseClient.from('ai_user_memory').insert({
            user_id: promotion.proposer_id,
            type: promotion.payload.type || 'knowledge',
            key: promotion.payload.key,
            value: promotion.payload.value,
            scope: 'admin',
            confidence: promotion.payload.confidence || 0.9,
            tenant_id: tenantId,
            source: 'promotion',
          });
        }

        // Mark as applied
        await supabaseClient
          .from('ai_promotion_queue')
          .update({ status: 'applied' })
          .eq('id', id);

        await supabaseClient.from('ai_promotion_audit').insert({
          promotion_id: id,
          actor_id: user.id,
          action: 'apply',
          notes: 'Applied by super admin',
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'audit': {
        const { promotion_id } = body;

        const { data: audit } = await supabaseClient
          .from('ai_promotion_audit')
          .select(`
            *,
            actor:actor_id(display_name)
          `)
          .eq('promotion_id', promotion_id)
          .order('created_at', { ascending: true });

        return new Response(JSON.stringify({ audit: audit || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: any) {
    console.error('Promotion manager error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
