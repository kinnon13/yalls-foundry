// Nightly Capability Ranking & Decay
// Re-scores gap signals, ranks opportunities by feasibility × impact, applies decay to stale items
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log('[rocker-capability-ranker] boot');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      gaps_analyzed: 0,
      opportunities_created: 0,
      opportunities_decayed: 0,
      stale_archived: 0,
    };

    // === 1. Analyze Recent Gap Signals (Last 7 Days) ===
    const { data: recentGaps, error: gapsError } = await supabase
      .from('rocker_gap_signals')
      .select('*')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (gapsError) throw gapsError;
    results.gaps_analyzed = recentGaps?.length || 0;

    // Group by kind and query pattern
    const clusters = new Map<string, any[]>();
    for (const gap of recentGaps || []) {
      const key = `${gap.kind}:${(gap.query || '').toLowerCase().substring(0, 50)}`;
      if (!clusters.has(key)) clusters.set(key, []);
      clusters.get(key)!.push(gap);
    }

    // === 2. Create/Update Opportunities from Clusters ===
    for (const [key, gapGroup] of clusters) {
      const [kind, queryPrefix] = key.split(':');
      
      // Calculate metrics
      const size = gapGroup.length; // How many users hit this gap
      const avgScore = gapGroup.reduce((sum, g) => sum + (g.score || 0), 0) / size;
      const recency = (Date.now() - new Date(gapGroup[0].created_at).getTime()) / (24 * 60 * 60 * 1000); // days
      
      // Feasibility heuristic (simpler gaps = higher feasibility)
      let feasibility = 0.5; // default
      if (kind === 'no_results') feasibility = 0.7; // Missing content = easier to add
      if (kind === 'low_conf') feasibility = 0.6; // Need better matches
      if (kind === 'research_needed') feasibility = 0.4; // External research = harder
      if (kind === 'stale') feasibility = 0.3; // Old data = needs refresh
      
      // Impact = size × avgScore × recency decay
      const recencyMultiplier = Math.max(0.1, 1 - (recency / 30)); // Decay over 30 days
      const impact = size * avgScore * recencyMultiplier;
      
      // Combined priority score
      const value = feasibility * impact;
      
      // Create or update opportunity
      const { data: existing } = await supabase
        .from('rocker_gap_opportunities')
        .select('id, value')
        .eq('kind', kind)
        .ilike('title', `%${queryPrefix.substring(0, 20)}%`)
        .maybeSingle();

      if (existing) {
        // Update existing with new score
        await supabase
          .from('rocker_gap_opportunities')
          .update({
            size,
            value,
            updated_at: new Date().toISOString(),
            meta: {
              avg_score: avgScore,
              recency_days: recency,
              feasibility,
              impact,
              last_gap_ids: gapGroup.slice(0, 10).map(g => g.id),
            },
          })
          .eq('id', existing.id);
      } else {
        // Create new opportunity
        const { error: createErr } = await supabase
          .from('rocker_gap_opportunities')
          .insert({
            title: `${kind}: ${gapGroup[0].query?.substring(0, 60) || 'Unnamed gap'}`,
            kind,
            entities: gapGroup[0].entities || {},
            size,
            value,
            status: 'open',
            meta: {
              avg_score: avgScore,
              recency_days: recency,
              feasibility,
              impact,
              sample_queries: gapGroup.slice(0, 5).map(g => g.query),
              gap_ids: gapGroup.map(g => g.id),
            },
          });

        if (!createErr) results.opportunities_created++;
      }
    }

    // === 3. Apply Decay to Stale Opportunities ===
    const DECAY_RATE = 0.01; // 1% per day
    const { data: allOpps } = await supabase
      .from('rocker_gap_opportunities')
      .select('id, value, updated_at')
      .eq('status', 'open');

    for (const opp of allOpps || []) {
      const daysSinceUpdate = (Date.now() - new Date(opp.updated_at).getTime()) / (24 * 60 * 60 * 1000);
      const decayFactor = Math.pow(1 - DECAY_RATE, daysSinceUpdate);
      const newValue = opp.value * decayFactor;

      // Archive if decayed below threshold
      if (newValue < 0.1) {
        await supabase
          .from('rocker_gap_opportunities')
          .update({ status: 'archived' })
          .eq('id', opp.id);
        results.stale_archived++;
      } else if (decayFactor < 0.95) {
        // Apply decay
        await supabase
          .from('rocker_gap_opportunities')
          .update({ value: newValue })
          .eq('id', opp.id);
        results.opportunities_decayed++;
      }
    }

    // === 4. Re-rank Top Opportunities ===
    const { data: topOpps } = await supabase
      .from('rocker_gap_opportunities')
      .select('id, title, value, size, kind')
      .eq('status', 'open')
      .order('value', { ascending: false })
      .limit(10);

    const latency = Date.now() - startTime;

    console.log('[Ranker] Complete:', {
      ...results,
      latency_ms: latency,
      top_opportunities: topOpps?.length || 0,
    });

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        latency_ms: latency,
        top_opportunities: topOpps || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (e: any) {
    console.error('[rocker-capability-ranker] error:', e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
