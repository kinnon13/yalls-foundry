// supabase/functions/generate-embeddings/index.ts
// Parallel worker for embedding generation using job queue

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "text-embedding-3-small";        // 1536 dims
const BATCH = 150;                              // rows per API call
const MAX_ROUNDS = 6;                           // loop to drain claims
const VECTOR_DIM = 1536;                        // must match table column
const MAX_CHARS_PER_INPUT = 8000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function normalize(t: string): string {
  const cleaned = t.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.length > MAX_CHARS_PER_INPUT ? cleaned.slice(0, MAX_CHARS_PER_INPUT) : cleaned;
}

async function fetchEmbeddings(texts: string[]): Promise<number[][]> {
  const input = texts.map(normalize);
  
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, input }),
  });

  if (!r.ok) {
    const msg = await r.text();
    throw new Error(`OpenAI ${r.status}: ${msg}`);
  }

  const json = await r.json();
  return json.data.map((d: any) => d.embedding);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { 
      status: 500, 
      headers: { ...CORS, "Content-Type": "application/json" } 
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { 
    auth: { persistSession: false } 
  });

  try {
    let totalDone = 0;
    
    for (let round = 0; round < MAX_ROUNDS; round++) {
      // 1) Claim jobs atomically
      const { data: claims, error: claimErr } = await supabase
        .rpc("claim_embedding_jobs", { p_limit: BATCH });
      
      if (claimErr) throw claimErr;
      if (!claims || claims.length === 0) break;

      // 2) Load text for claimed knowledge_ids
      const ids = claims.map((c: any) => c.knowledge_id);
      const { data: rows, error: selErr } = await supabase
        .from("rocker_knowledge")
        .select("id, content")
        .in("id", ids);
      
      if (selErr) throw selErr;

      // Keep order aligned with claims
      const idToContent = new Map(rows.map((r: any) => [r.id, r.content]));
      const inputs: string[] = [];
      const orderedIds: string[] = [];
      
      for (const c of claims) {
        const t = idToContent.get(c.knowledge_id);
        if (t) { 
          inputs.push(t); 
          orderedIds.push(c.knowledge_id); 
        }
      }
      
      if (inputs.length === 0) continue;

      // 3) Call OpenAI with retry
      let vectors: number[][] = [];
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          vectors = await fetchEmbeddings(inputs);
          break;
        } catch (e: any) {
          const transient = /429|5\d\d/.test(String(e));
          if (attempt === 4 || !transient) throw e;
          await new Promise(r => setTimeout(r, 300 * attempt));
        }
      }

      // Dimension check
      if (!vectors.length || vectors[0].length !== VECTOR_DIM) {
        throw new Error(`Embedding dim mismatch. Got ${vectors[0]?.length}, expected ${VECTOR_DIM}.`);
      }

      // 4) Update embeddings
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i];
        const vec = vectors[i];
        
        const { error: updErr } = await supabase
          .from("rocker_knowledge")
          .update({ embedding: vec as any })
          .eq("id", id);
        
        if (updErr) {
          await supabase.from("embedding_jobs")
            .update({ 
              status: "error", 
              last_error: updErr.message, 
              updated_at: new Date().toISOString() 
            })
            .eq("knowledge_id", id);
        } else {
          totalDone++;
        }
      }

      // 5) Mark claimed jobs as done
      const jobIds = claims.map((c: any) => c.job_id);
      await supabase.from("embedding_jobs")
        .update({ status: "done", updated_at: new Date().toISOString() })
        .in("id", jobIds);
    }

    // Audit
    await supabase.from("ai_action_ledger")
      .insert({ 
        agent: "rocker", 
        action: "generate_embeddings_parallel", 
        input: {}, 
        output: { embedded: totalDone }, 
        result: "success" 
      })
      .catch(() => {});

    return new Response(JSON.stringify({ ok: true, embedded: totalDone }), { 
      headers: { ...CORS, "Content-Type": "application/json" } 
    });
  } catch (err: any) {
    console.error("[generate-embeddings]", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), { 
      status: 500, 
      headers: { ...CORS, "Content-Type": "application/json" } 
    });
  }
});
