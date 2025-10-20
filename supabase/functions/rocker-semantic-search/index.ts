import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { query, limit = 10, thread_id = null } = await req.json();
    
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query required" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // 1) Embed the query using OpenAI
    const embedRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: query,
      }),
    });

    if (!embedRes.ok) {
      const msg = await embedRes.text();
      return new Response(
        JSON.stringify({ error: `Embedding error ${embedRes.status}: ${msg}` }),
        { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const embedJson = await embedRes.json();
    const queryVector: number[] = embedJson.data[0].embedding;

    // 2) Call database RPC for fast server-side vector search
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.rpc("match_rocker_memory_vec", {
      q: queryVector,
      match_count: Math.max(1, Math.min(50, Number(limit) || 10)),
      thread: thread_id,
    });

    if (error) {
      console.error("[semantic-search] RPC error:", error);
      return new Response(
        JSON.stringify({ error: "Vector search failed", details: error.message }),
        { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // 3) Format and return results
    const results = (data ?? []).map((r: any) => ({
      id: r.id,
      chunk_index: r.chunk_index,
      similarity: r.similarity,
      content: String(r.content || "").slice(0, 1200),
      meta: r.meta,
      created_at: r.created_at,
    }));

    return new Response(
      JSON.stringify({
        method: "semantic",
        query,
        thread_id,
        count: results.length,
        results,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("[rocker-semantic-search] Error:", e);
    return new Response(
      JSON.stringify({ error: e?.message || String(e) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
