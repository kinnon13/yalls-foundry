// Lifecycle Manager: Auto-archives stale projects, decays suggestions, manages data lifecycle
// Runs nightly via cron
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log('[rocker-lifecycle-manager] boot');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STALE_THRESHOLD_DAYS = 45; // Archive files not accessed in 45+ days
const DECAY_RATE = 0.01; // 1% decay per day

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const startTime = Date.now();
    const results = {
      files_archived: 0,
      suggestions_decayed: 0,
      opportunities_archived: 0,
      knowledge_cleaned: 0,
    };

    // === 1. Archive Stale Files ===
    const staleDate = new Date(Date.now() - STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000).toISOString();
    
    // Find files not accessed recently
    const { data: staleFiles } = await supabase
      .from('rocker_files')
      .select('id, name')
      .lt('updated_at', staleDate);

    if (staleFiles && staleFiles.length > 0) {
      // Move associated chunks to archived state (soft delete via metadata)
      for (const file of staleFiles) {
        await supabase
          .from('rocker_knowledge')
          .update({
            // Soft archive by flagging in meta
            meta: { archived: true },
          })
          .eq('file_id', file.id);
        
        results.files_archived++;
      }
      
      console.log(`[Lifecycle] Archived ${results.files_archived} stale files`);
    }

    // === 2. Decay Stale Suggestions (Gap Opportunities) ===
    const { data: opportunities } = await supabase
      .from('rocker_gap_opportunities')
      .select('id, value, updated_at')
      .eq('status', 'open');

    for (const opp of opportunities || []) {
      const daysSinceUpdate = (Date.now() - new Date(opp.updated_at).getTime()) / (24 * 60 * 60 * 1000);
      const decayFactor = Math.pow(1 - DECAY_RATE, daysSinceUpdate);
      const newValue = opp.value * decayFactor;

      if (newValue < 0.1) {
        // Archive if decayed below threshold
        await supabase
          .from('rocker_gap_opportunities')
          .update({ status: 'archived', value: newValue })
          .eq('id', opp.id);
        results.opportunities_archived++;
      } else if (decayFactor < 0.95) {
        // Apply decay
        await supabase
          .from('rocker_gap_opportunities')
          .update({ value: newValue })
          .eq('id', opp.id);
        results.suggestions_decayed++;
      }
    }

    // === 3. Clean Up Old Analysis Logs (keep only last 90 days) ===
    const cleanupDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: deleted } = await supabase
      .from('rocker_deep_analysis')
      .delete()
      .lt('created_at', cleanupDate)
      .select('id');

    results.knowledge_cleaned = deleted?.length || 0;

    // === 4. Update File Access Timestamps (for files queried via search) ===
    // This is passive - actual access tracking happens during queries in rocker-chat-simple

    const latency = Date.now() - startTime;

    console.log('[Lifecycle] Complete:', {
      ...results,
      latency_ms: latency,
    });

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        latency_ms: latency,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (e: any) {
    console.error('[rocker-lifecycle-manager] error:', e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
