import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

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

    const { action, ...params } = await req.json();

    switch (action) {
      case 'create_proposal':
        return await createProposal(supabaseClient, user.id, params);
      
      case 'approve_change':
        return await approveChange(supabaseClient, user.id, params);
      
      case 'commit_change':
        return await commitChange(supabaseClient, user.id, params);
      
      case 'list_proposals':
        return await listProposals(supabaseClient, user.id, params);
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in rocker-proposals:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function createProposal(supabase: any, userId: string, params: any) {
  const { tenant_id, target_scope, target_ref, change, approver_policy } = params;

  const proposalData = {
    tenant_id,
    target_scope,
    target_ref,
    change,
    requested_by: userId,
    approver_policy,
    approvals_required: calculateRequiredApprovals(approver_policy),
    status: 'pending'
  };

  const { data, error } = await supabase
    .from('ai_change_proposals')
    .insert(proposalData)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Log the proposal creation using audit RPC
  await supabase.rpc('audit_write', {
    p_actor: userId,
    p_role: 'user',
    p_tenant: tenant_id,
    p_action: 'create_proposal',
    p_scope: target_scope,
    p_targets: [target_ref],
    p_meta: { proposal_id: data.id }
  });

  return new Response(JSON.stringify({ proposal: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function approveChange(supabase: any, userId: string, params: any) {
  const { proposal_id, decision, reason, role } = params;

  // Use atomic RPC to record approval
  const { data, error } = await supabase.rpc('record_approval_tx', {
    p_proposal_id: proposal_id,
    p_approver: userId,
    p_role: role,
    p_decision: decision,
    p_reason: reason || null
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Auto-commit if approved
  if (decision === 'approve') {
    const { data: commitResult, error: commitError } = await supabase.rpc('commit_change_tx', {
      p_proposal_id: proposal_id,
      p_actor: userId
    });

    if (commitError) {
      console.error('Commit error:', commitError);
    }
  }

  return new Response(JSON.stringify({ success: true, result: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function commitChange(supabase: any, userId: string, params: any) {
  const { proposal_id } = params;

  // Use atomic RPC to commit change
  const { data, error } = await supabase.rpc('commit_change_tx', {
    p_proposal_id: proposal_id,
    p_actor: userId
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, result: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function listProposals(supabase: any, userId: string, params: any) {
  const { status, limit = 20 } = params;

  let query = supabase
    .from('ai_change_proposals')
    .select('*, ai_change_approvals(*)')
    .or(`requested_by.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ proposals: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Helper functions

function calculateRequiredApprovals(policy: any): number {
  if (policy.min) return policy.min;
  if (policy.anyOf) return 1;
  if (policy.allOf) return policy.allOf.length;
  return 1;
}
