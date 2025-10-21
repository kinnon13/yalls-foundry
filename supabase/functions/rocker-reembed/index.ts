import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireSuperAdmin } from "../_shared/requireSuperAdmin.ts";
import { ai } from "../_shared/ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Auth gate (super admin only)
  const gate = await requireSuperAdmin(req);
  if (!gate.ok) {
    return new Response(JSON.stringify({ error: gate.msg }), {
      status: gate.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Service client (bypass RLS to process embeddings safely)
  const service = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.json().catch(() => ({}));
    const { limit = 500, reset = false, sources = ['rocker_knowledge'] } = body as {
      limit?: number;
      reset?: boolean;
      sources?: string[]; // e.g., ['rocker_knowledge', 'knowledge_items']
    };

    const result: Record<string, any> = { processed: {}, errors: [] };

    // Helper: batch embed and update
    async function processTable(
      table: 'rocker_knowledge' | 'knowledge_items',
    ) {
      result.processed[table] = { rows: 0, embedded: 0 };

      // Optional reset: clear embeddings to force re-embed
      if (reset) {
        try {
          if (table === 'rocker_knowledge') {
            await service.from('rocker_knowledge').update({ embedding: null as any }).is('embedding', null).select('id').limit(0);
          }
          // For knowledge_items, embeddings live in chunks table typically; we don't reset here
        } catch (e) {
          result.errors.push({ table, step: 'reset', error: String(e) });
        }
      }

      if (table === 'rocker_knowledge') {
        // Fetch rows missing embeddings
        const { data: rows, error } = await service
          .from('rocker_knowledge')
          .select('id, content')
          .is('embedding', null)
          .limit(limit);
        if (error) { result.errors.push({ table, step: 'select', error }); return; }
        if (!rows || rows.length === 0) return;

        result.processed[table].rows = rows.length;
        const inputs = rows.map((r: any) => (r.content || '').toString().slice(0, 8000));

        // Generate embeddings via unified gateway
        const vectors = await ai.embed('knower', inputs);

        let embedded = 0;
        for (let i = 0; i < rows.length; i++) {
          const id = (rows as any)[i].id;
          const vec = (vectors as any)[i];
          if (!Array.isArray(vec)) continue;
          const { error: upErr } = await service
            .from('rocker_knowledge')
            .update({ embedding: vec as any })
            .eq('id', id);
          if (!upErr) embedded++;
        }
        result.processed[table].embedded = embedded;
      }

      if (table === 'knowledge_items') {
        // Backfill: for items without chunks, create chunks and embed using kb-ingest logic isn't trivial here.
        // Minimal: count pending to inform caller.
        const { count, error } = await service
          .from('knowledge_chunks')
          .select('*', { count: 'exact', head: true })
          .is('embedding', null as any);
        if (error) { result.errors.push({ table, step: 'count', error }); return; }
        result.processed[table].rows = count || 0;
      }
    }

    for (const src of sources) {
      if (src === 'rocker_knowledge' || src === 'knowledge_items') {
        await processTable(src as any);
      }
    }

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[rocker-reembed]', e);
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
