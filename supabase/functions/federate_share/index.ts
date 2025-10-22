// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { version = 1 } = await req.json();

    // Aggregate last 24h learnings into coarse buckets (privacy)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: learns } = await supabase
      .from('ai_learnings')
      .select('rating, tags, model_name')
      .gte('created_at', yesterday.toISOString());

    // Simple aggregation: count by rating buckets
    const buckets = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: (learns || []).filter(l => l.rating === rating).length
    }));

    await supabase.from('ai_learnings_agg').insert({
      version,
      stats: { buckets, total: (learns || []).length }
    });

    return new Response(
      JSON.stringify({ ok: true, buckets: buckets.length }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
