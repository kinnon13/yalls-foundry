import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  try {
    const { query, limit = 10, thread_id } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "Query required" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Generate embedding for the query
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
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

    if (!embeddingResponse.ok) {
      throw new Error(`OpenAI embedding error: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Search for similar chunks using vector similarity
    let sqlQuery = `
      select 
        id,
        content,
        metadata,
        chunk_index,
        1 - (embedding <=> $1::vector) as similarity
      from rocker_knowledge
      where embedding is not null
    `;

    if (thread_id) {
      sqlQuery += ` and (metadata->>'thread_id') = $2`;
    }

    sqlQuery += `
      order by embedding <=> $1::vector
      limit $${thread_id ? '3' : '2'}
    `;

    const { data: results, error: searchError } = await sb.rpc('exec_sql', {
      sql: sqlQuery,
      params: thread_id ? [queryEmbedding, thread_id, limit] : [queryEmbedding, limit]
    }).single();

    if (searchError) {
      console.error("Search error:", searchError);
      
      // Fallback: direct query without RPC
      const { data: fallbackResults, error: fallbackError } = await sb
        .from("rocker_knowledge")
        .select("id, content, metadata, chunk_index")
        .not("embedding", "is", null)
        .limit(limit);

      if (fallbackError) throw fallbackError;

      return new Response(JSON.stringify({ 
        results: fallbackResults || [],
        method: "fallback"
      }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      results: results || [],
      query,
      method: "semantic"
    }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[rocker-semantic-search]", e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
