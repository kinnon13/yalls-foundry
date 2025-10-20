// supabase/functions/generate-embeddings/index.ts
// POST { limit_per_run?: number, by_user_id?: string }

import "https://deno.land/x/xhr@0.1.0/mod.ts"; // fetch in Deno edge
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "text-embedding-3-small";    // 1536-dim
const BATCH_SIZE = 96;                      // safe API batch size
const MAX_ROWS_PER_RUN = 1000;              // cap memory use
const MAX_CHARS_PER_INPUT = 8000;           // trim very long chunks (safety)
const OPENAI_TIMEOUT_MS = 30000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Idempotency-Key",
};

function normalize(t: string): string {
  // Strip control chars, collapse whitespace, hard trim
  const cleaned = t.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.length > MAX_CHARS_PER_INPUT ? cleaned.slice(0, MAX_CHARS_PER_INPUT) : cleaned;
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

/** Call OpenAI with basic retry on 429/5xx */
async function embedBatch(texts: string[]): Promise<number[][]> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  // sanitize inputs
  const input = texts.map(normalize);

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const resp = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ model: MODEL, input }),
        signal: controller.signal,
      });

      if (resp.ok) {
        const data = await resp.json();
        clearTimeout(id);
        return data.data.map((d: any) => d.embedding as number[]);
      }

      const text = await resp.text();
      if (resp.status === 429 || (resp.status >= 500 && resp.status < 600)) {
        // exponential backoff with jitter
        await sleep(300 * (2 ** attempt) + Math.random() * 200);
        continue;
      }
      throw new Error(`OpenAI error ${resp.status}: ${text}`);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        // timeout -> retry
        await sleep(300 * (2 ** attempt) + Math.random() * 200);
        continue;
      }
      if (attempt === 3) throw e;
      await sleep(300 * (2 ** attempt) + Math.random() * 200);
    }
  }
  throw new Error("OpenAI embedding failed after retries");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const body = await req.json().catch(() => ({}));
    const limitPerRun = Math.min(Number(body?.limit_per_run) || 400, MAX_ROWS_PER_RUN);
    const byUserId = body?.by_user_id as string | undefined;

    // Pull a window of rows with NULL embeddings; dedupe noisy/empty content early
    let q = supabase
      .from("rocker_knowledge")
      .select("id, user_id, content")
      .is("embedding", null)
      .order("created_at", { ascending: true })
      .limit(limitPerRun);

    if (byUserId) q = q.eq("user_id", byUserId);

    const { data: rows, error } = await q;
    if (error) throw error;

    const filtered = (rows ?? []).filter(r => r?.content && r.content.trim().length > 0);
    if (filtered.length === 0) {
      return new Response(JSON.stringify({ ok: true, updated: 0, note: "Nothing to embed" }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    let updated = 0;

    // Process in API-size batches; update row-by-row to keep payloads small
    for (let i = 0; i < filtered.length; i += BATCH_SIZE) {
      const batch = filtered.slice(i, i + BATCH_SIZE);
      const vectors = await embedBatch(batch.map(b => b.content));

      for (let j = 0; j < batch.length; j++) {
        const { error: upErr } = await supabase
          .from("rocker_knowledge")
          .update({ embedding: vectors[j] as unknown as any })
          .eq("id", batch[j].id);
        if (upErr) throw upErr;
        updated++;
      }
    }

    // Optional: emit a tiny audit event (non-blocking)
    await supabase.from("ai_action_ledger")
      .insert({ agent: "rocker", action: "generate_embeddings", input: { byUserId, limitPerRun }, output: { updated }, result: "success" })
      .catch(() => { /* best effort */ });

    return new Response(JSON.stringify({ ok: true, updated }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[generate-embeddings] error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
