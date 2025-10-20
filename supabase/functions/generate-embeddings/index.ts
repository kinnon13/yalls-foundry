// Minimal, crash-proof embedder
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const MODEL = "text-embedding-3-small";  // 1536 dims
const CLAIM = 150;
const MAX_ROUNDS = 6;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function normalize(t: string, max = 8000): string {
  const s = (t ?? "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max) : s;
}

async function fetchEmbeddings(texts: string[]): Promise<number[][]> {
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, input: texts }),
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.data.map((d: any) => d.embedding as number[]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (!OPENAI_API_KEY) return new Response(JSON.stringify({ error: "OPENAI_API_KEY missing" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  try {
    let total = 0;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      // 1) Claim jobs
      const { data: claims, error: claimErr } = await sb.rpc("claim_embedding_jobs", { p_limit: CLAIM });
      if (claimErr) throw claimErr;
      if (!claims || claims.length === 0) break;

      // 2) Load content
      const ids = claims.map((c: any) => c.knowledge_id);
      const { data: rows, error: selErr } = await sb
        .from("rocker_knowledge")
        .select("id, content")
        .in("id", ids);
      if (selErr) throw selErr;

      // Keep order aligned with claims
      const map = new Map(rows.map((r: any) => [r.id, r.content]));
      const inputs: string[] = [];
      const orderedIds: string[] = [];
      for (const c of claims) {
        const t = map.get(c.knowledge_id);
        if (t) {
          const normalized = normalize(t);
          if (normalized) {
            inputs.push(normalized);
            orderedIds.push(c.knowledge_id);
          }
        }
      }
      if (inputs.length === 0) continue;

      // 3) Embed (with simple retry)
      let vectors: number[][] = [];
      for (let attempt = 1; attempt <= 4; attempt++) {
        try { vectors = await fetchEmbeddings(inputs); break; }
        catch (e) {
          if (attempt === 4) throw e;
          await new Promise(r => setTimeout(r, 300 * attempt));
        }
      }

      // 4) Update rows
      for (let i = 0; i < orderedIds.length; i++) {
        const { error: uerr } = await sb
          .from("rocker_knowledge")
          .update({ embedding: vectors[i] as any })
          .eq("id", orderedIds[i]);
        if (!uerr) total++;
      }

      // 5) Mark jobs done
      const jobIds = claims.map((c: any) => c.job_id ?? c.id);
      await sb.from("embedding_jobs").update({ status: "done", updated_at: new Date().toISOString() }).in("id", jobIds);
    }

    return new Response(JSON.stringify({ ok: true, embedded: total }), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("[generate-embeddings]", e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
