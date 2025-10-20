// supabase/functions/generate-embeddings/index.ts
// POST { limit_per_run?: number, by_user_id?: string }  // optional filters

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const MODEL = "text-embedding-3-small";     // 1536-dim
const BATCH_SIZE = 96;                      // safe API batch
const MAX_ROWS = 1000;                      // ceiling per run to protect memory
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function embedBatch(texts: string[]): Promise<number[][]> {
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, input: texts }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI error ${resp.status}: ${err}`);
  }
  const data = await resp.json();
  return data.data.map((d: any) => d.embedding as number[]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // Service role (bypasses RLS by design)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { limit_per_run, by_user_id } = (await req.json().catch(() => ({}))) ?? {};
    const hardLimit = Math.min(Number(limit_per_run) || 400, MAX_ROWS);

    // Pull a window of rows with NULL embeddings (optionally scoped to a user)
    let query = supabase
      .from("rocker_knowledge")
      .select("id, user_id, content")
      .is("embedding", null)
      .order("created_at", { ascending: true })
      .limit(hardLimit);

    if (by_user_id) query = query.eq("user_id", by_user_id);

    const { data: rows, error } = await query;
    if (error) throw error;
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ ok: true, updated: 0, note: "Nothing to embed" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    let updated = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const inputs = batch.map((r) => r.content);

      const vectors = await embedBatch(inputs);

      // Update each row (use small grouped updates to reduce payload size)
      for (let j = 0; j < batch.length; j++) {
        const r = batch[j];
        const v = vectors[j];

        const { error: upErr } = await supabase
          .from("rocker_knowledge")
          .update({ embedding: v as unknown as any }) // Supabase accepts number[] for vector
          .eq("id", r.id);
        if (upErr) throw upErr;
        updated++;
      }
    }

    return new Response(JSON.stringify({ ok: true, updated }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[generate-embeddings] error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
