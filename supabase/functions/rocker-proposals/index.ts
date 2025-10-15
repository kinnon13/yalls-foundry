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

  // Log the proposal creation
  await supabase.from('admin_audit_log').insert({
    actor_user_id: userId,
    action: 'create_proposal',
    metadata: {
      proposal_id: data.id,
      target_scope,
      target_ref
    }
  });

  return new Response(JSON.stringify({ proposal: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function approveChange(supabase: any, userId: string, params: any) {
  const { proposal_id, decision, reason, role } = params;

  // Verify user has permission to approve
  const { data: proposal, error: proposalError } = await supabase
    .from('ai_change_proposals')
    .select('*')
    .eq('id', proposal_id)
    .single();

  if (proposalError || !proposal) {
    return new Response(JSON.stringify({ error: 'Proposal not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Check if user matches approver policy
  const canApprove = await checkApproverEligibility(supabase, userId, role, proposal.approver_policy);
  if (!canApprove) {
    return new Response(JSON.stringify({ error: 'User not eligible to approve' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Record the approval
  const { data: approval, error: approvalError } = await supabase
    .from('ai_change_approvals')
    .insert({
      proposal_id,
      approver_id: userId,
      approver_role: role,
      decision,
      reason
    })
    .select()
    .single();

  if (approvalError) {
    return new Response(JSON.stringify({ error: approvalError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Update approval count
  if (decision === 'approve') {
    const { data: updated } = await supabase
      .from('ai_change_proposals')
      .update({ 
        approvals_collected: proposal.approvals_collected + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', proposal_id)
      .select()
      .single();

    // Auto-commit if threshold met
    if (updated && updated.approvals_collected >= updated.approvals_required) {
      await commitChange(supabase, userId, { proposal_id });
    }
  }

  return new Response(JSON.stringify({ approval }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function commitChange(supabase: any, userId: string, params: any) {
  const { proposal_id } = params;

  // Get proposal
  const { data: proposal, error: proposalError } = await supabase
    .from('ai_change_proposals')
    .select('*')
    .eq('id', proposal_id)
    .single();

  if (proposalError || !proposal) {
    return new Response(JSON.stringify({ error: 'Proposal not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Verify approvals
  if (proposal.approvals_collected < proposal.approvals_required) {
    return new Response(JSON.stringify({ error: 'Insufficient approvals' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Apply the change based on target_scope
  let result: { data?: any; error?: string };
  switch (proposal.target_scope) {
    case 'user_memory':
      result = await applyUserMemoryChange(supabase, proposal);
      break;
    case 'entity':
      result = await applyEntityChange(supabase, proposal);
      break;
    case 'global':
      result = await applyGlobalChange(supabase, proposal);
      break;
    default:
      return new Response(JSON.stringify({ error: 'Invalid target scope' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
  }

  if (result.error) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Mark proposal as approved
  await supabase
    .from('ai_change_proposals')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', proposal_id);

  // Log the commit
  await supabase.from('admin_audit_log').insert({
    actor_user_id: userId,
    action: 'commit_change',
    metadata: {
      proposal_id,
      target_scope: proposal.target_scope,
      target_ref: proposal.target_ref
    }
  });

  return new Response(JSON.stringify({ success: true, result: result.data }), {
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

async function checkApproverEligibility(supabase: any, userId: string, role: string, policy: any): Promise<boolean> {
  // Check if user has the required role
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (!userRoles) return false;

  const userRoleList = userRoles.map((r: any) => r.role);

  // Check against policy
  if (policy.anyOf) {
    return policy.anyOf.some((req: any) => req.role === role && userRoleList.includes(role));
  }

  if (policy.allOf) {
    return policy.allOf.some((req: any) => req.role === role && userRoleList.includes(role));
  }

  return userRoleList.includes(role);
}

async function applyUserMemoryChange(supabase: any, proposal: any) {
  const change = proposal.change;
  const userId = extractUserIdFromRef(proposal.target_ref);

  if (change.op === 'upsert') {
    const { data, error } = await supabase
      .from('ai_user_memory')
      .upsert({
        user_id: userId,
        tenant_id: proposal.tenant_id,
        key: change.key,
        value: change.value,
        type: change.type || 'fact',
        confidence: change.confidence || 0.9,
        provenance: [{
          source: 'proposal',
          proposal_id: proposal.id,
          timestamp: new Date().toISOString()
        }]
      }, { onConflict: 'tenant_id,user_id,key' })
      .select()
      .single();

    return { data, error: error?.message };
  }

  return { error: 'Unsupported operation' };
}

async function applyEntityChange(supabase: any, proposal: any): Promise<{ data?: any; error?: string }> {
  // Handle entity changes (horses, events, etc.)
  const change = proposal.change;
  const [entityType, entityId] = proposal.target_ref.split(':');

  // For now, just log - specific entity updates would go here
  console.log('Entity change:', { entityType, entityId, change });
  
  return { data: { applied: true } };
}

async function applyGlobalChange(supabase: any, proposal: any) {
  const change = proposal.change;

  if (change.op === 'upsert') {
    const { data, error } = await supabase
      .from('ai_global_knowledge')
      .upsert({
        tenant_id: proposal.tenant_id,
        key: change.key,
        value: change.value,
        type: change.type || 'policy'
      }, { onConflict: 'tenant_id,key' })
      .select()
      .single();

    return { data, error: error?.message };
  }

  return { error: 'Unsupported operation' };
}

function extractUserIdFromRef(ref: string): string {
  const parts = ref.split(':');
  return parts[parts.length - 1];
}
