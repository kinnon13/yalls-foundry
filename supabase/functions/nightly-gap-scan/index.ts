/**
 * Nightly Gap Scan
 * Clusters signals → creates/updates opportunities → ranks by $$ priority
 * 
 * Schedule: 0 4 * * * (4am daily)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log('[GapScan] Starting nightly gap scan...');
    const t0 = Date.now();

    // 1) Get clusters from view
    const { data: clusters, error: clusterErr } = await supabase
      .from('v_gap_clusters')
      .select('*')
      .order('size', { ascending: false })
      .limit(100);

    if (clusterErr) throw clusterErr;
    console.log(`[GapScan] Found ${clusters?.length || 0} clusters`);

    // 2) Upsert opportunities
    let inserted = 0, updated = 0;
    for (const c of clusters || []) {
      const title = c.kind === 'stale' 
        ? `Refresh docs: ${c.topic} (${c.crop}/${c.season})`
        : c.kind in ['no_results','low_conf']
        ? `Missing content: ${c.topic} (${c.crop}/${c.season})`
        : `${c.kind}: ${c.topic}`;

      const kind = ['no_results','low_conf','stale'].includes(c.kind) ? 'content' : 'playbook';
      const entities = { crop: c.crop, pest: c.pest, equipment: c.equipment, season: c.season };
      const size = c.size || 0;
      const pain = c.pain || 0;
      const seasonBoost = c.season === new Date().getFullYear().toString() ? 0.2 : 0;
      const value = Math.min(1.0, pain + seasonBoost);
      const effort = c.kind === 'stale' ? 0.3 : c.kind in ['no_results','low_conf'] ? 0.5 : 0.6;

      // Check if exists by cluster_id (store in meta)
      const { data: existing } = await supabase
        .from('rocker_gap_opportunities')
        .select('id')
        .eq('title', title)
        .eq('status', 'open')
        .maybeSingle();

      if (existing) {
        await supabase.from('rocker_gap_opportunities').update({
          size, value, effort,
          evidence: c.evidence_ids || [],
          updated_at: new Date().toISOString()
        }).eq('id', existing.id);
        updated++;
      } else {
        await supabase.from('rocker_gap_opportunities').insert({
          title, kind, entities, size, value, effort,
          priority: 0, // will compute next
          evidence: c.evidence_ids || [],
          status: 'open'
        });
        inserted++;
      }
    }

    // 3) Recompute priority for all open opportunities
    const { data: opps } = await supabase
      .from('rocker_gap_opportunities')
      .select('id,size,value,entities')
      .eq('status', 'open');

    if (opps && opps.length > 0) {
      const maxSize = Math.max(...opps.map((o: any) => o.size || 1));
      for (const opp of opps) {
        const sizeNorm = (opp.size || 0) / maxSize;
        const seasonBoost = (opp.entities as any)?.season === new Date().getFullYear().toString() ? 0.1 : 0;
        const priority = Math.round((sizeNorm * 0.5 + (opp.value || 0) * 0.4 + seasonBoost) * 1000) / 1000;
        await supabase.from('rocker_gap_opportunities').update({ priority }).eq('id', opp.id);
      }
    }

    // 4) Get top 10 for report
    const { data: top10 } = await supabase
      .from('rocker_gap_opportunities')
      .select('title,kind,priority,size,value,effort,created_at')
      .eq('status', 'open')
      .order('priority', { ascending: false })
      .limit(10);

    const elapsed = Date.now() - t0;
    console.log(`[GapScan] Done in ${elapsed}ms: ${inserted} new, ${updated} updated`);

    return new Response(JSON.stringify({
      success: true,
      clusters: clusters?.length || 0,
      inserted,
      updated,
      top10: top10 || [],
      elapsed_ms: elapsed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('[GapScan] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
