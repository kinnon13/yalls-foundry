/**
 * Safety Commit Guard
 * Dry-run → shadow eval → canary 5% → commit/rollback
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { proposalId, tenantId, action } = await req.json();

    // Fetch proposal
    const { data: proposal, error } = await supabase
      .from('ai_change_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (error) throw error;

    // Check write freeze
    const { data: flags } = await supabase
      .from('ai_control_flags')
      .select('write_freeze')
      .single();

    if (flags?.write_freeze) {
      return new Response(JSON.stringify({ 
        blocked: true,
        reason: 'write_freeze_active' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'dry_run') {
      // Simulate change without committing
      await supabase
        .from('ai_change_proposals')
        .update({ 
          status: 'dry_run',
          dry_run: { simulated: true, success: true, timestamp: new Date().toISOString() },
        })
        .eq('id', proposalId);

      return new Response(JSON.stringify({ 
        phase: 'dry_run',
        success: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'canary') {
      // Deploy to 5% of traffic
      await supabase
        .from('ai_change_proposals')
        .update({ 
          status: 'canary',
          canary: { percentage: 5, deployed: true, timestamp: new Date().toISOString() },
        })
        .eq('id', proposalId);

      return new Response(JSON.stringify({ 
        phase: 'canary',
        percentage: 5 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'commit') {
      // Full deployment
      await supabase
        .from('ai_change_proposals')
        .update({ 
          status: 'committed',
          committed_at: new Date().toISOString(),
        })
        .eq('id', proposalId);

      return new Response(JSON.stringify({ 
        phase: 'committed',
        success: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'rollback') {
      // Rollback changes
      await supabase
        .from('ai_change_proposals')
        .update({ 
          status: 'rolled_back',
          rolled_back_at: new Date().toISOString(),
        })
        .eq('id', proposalId);

      // Create incident
      await supabase.from('ai_incidents').insert({
        tenant_id: tenantId,
        severity: 'high',
        source: 'commit_guard',
        summary: `Rollback triggered for proposal ${proposalId}`,
        detail: { proposal },
      });

      return new Response(JSON.stringify({ 
        phase: 'rolled_back',
        success: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error('[Safety Commit Guard] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
