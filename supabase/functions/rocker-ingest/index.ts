// supabase/functions/rocker-ingest/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-subject, x-thread-id",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const MAX_CHARS = 120_000;      // hard cap for streamed total size (safe for edge)
const CHUNK = 2000;             // chunk size
const OVERLAP = 100;            // overlap between chunks
const MAX_CHUNKS = 150;         // per paste cap

function asText(dec: TextDecoder, u8?: Uint8Array) {
  return u8 ? dec.decode(u8, { stream: true }) : dec.decode(); // flush
}

/**
 * Stream the request body (text/plain) and yield fixed-size chunks with overlap.
 * Keeps at most ~CHUNK+OVERLAP characters in memory.
 */
async function* streamChunks(req: Request, sizeCap = MAX_CHARS) {
  const body = req.body;
  if (!body) return;

  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let total = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const piece = asText(dec, value);
    total += piece.length;
    if (total > sizeCap) {
      throw new Error(`Text too large (${Math.round(total/1000)}KB). Max ${Math.round(sizeCap/1000)}KB.`);
    }

    buf += piece;
    // Emit fixed-size slices with overlap, maintain small sliding window
    while (buf.length >= CHUNK) {
      const out = buf.slice(0, CHUNK);
      yield out;
      buf = buf.slice(CHUNK - OVERLAP); // keep overlap from end
    }
  }
  // flush decoder (handles final UTF-8 boundary)
  buf += asText(new TextDecoder());
  if (buf) yield buf;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  try {
    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Inputs
    const ct = (req.headers.get("content-type") || "").toLowerCase();
    let subject = req.headers.get("x-subject") || "Bulk Paste";
    let threadId = req.headers.get("x-thread-id") || "";

    // If JSON (small bodies), keep your old path
    if (ct.includes("application/json")) {
      const { text, subject: subJ, thread_id } = await req.json();
      if (!text || typeof text !== "string") {
        return new Response(JSON.stringify({ error: "Missing text" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      subject = subJ || subject;
      threadId = thread_id || threadId;

      // Handle via small-buffer path (enforce tighter cap to avoid memory spikes)
      if (text.length > 80_000) {
        return new Response(JSON.stringify({ error: "Use text/plain for large pastes (> 80KB)" }), {
          status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Convert to a ReadableStream for the same streaming pipeline
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(text));
          controller.close();
        },
      });
      req = new Request(req.url, { method: req.method, headers: req.headers, body: stream });
    }

    // Ensure thread exists
    if (!threadId) {
      const { data: thread, error: threadError } = await supabase
        .from("rocker_threads")
        .insert({ user_id: user.id, subject: subject || "Super Rocker Memory" })
        .select()
        .single();
      if (threadError) throw threadError;
      threadId = thread.id;
    }

    // Priority (optional)
    const { data: isSuperAdmin } = await supabase.rpc("is_super_admin", { _user_id: user.id });
    const priority = isSuperAdmin === true ? 10 : 100;

    // Light auto-categorization
    let category = "Notes";
    if (subject && subject.toLowerCase() !== "super rocker memory") {
      category = subject.slice(0, 50);
    }

    // Stream → insert per chunk (constant memory)
    let stored = 0;
    let index = 0;

    for await (const chunk of streamChunks(req)) {
      if (index >= MAX_CHUNKS) break;

      const { data: inserted, error } = await supabase
        .from("rocker_knowledge")
        .insert([{
          user_id: user.id,
          content: chunk,
          chunk_index: index,
          meta: {
            subject: subject || category,
            category,
            tags: [],
            source: "paste",
            total_chunks_hint: "streamed",
            priority,
            thread_id: threadId,
          },
        }])
        .select("id")
        .single();
      
      if (error) throw error;

      // Enqueue embedding job
      if (inserted?.id) {
        await supabase.from("embedding_jobs").insert({
          knowledge_id: inserted.id,
          priority: index < 20 ? 1 : 5, // Prioritize first 20 chunks
        });
      }

      index += 1;
      stored += 1;

      // Tiny yield to avoid hot-looping the edge
      if (index % 50 === 0) await new Promise(r => setTimeout(r, 5));
    }

    // Ledger
    await supabase.from("ai_action_ledger").insert({
      user_id: user.id,
      agent: "rocker",
      action: "memory_ingest_stream",
      input: { streaming: true, chunk_size: CHUNK, overlap: OVERLAP },
      output: { thread_id: threadId, memories: stored, category, priority },
      result: "success",
    });

    return new Response(JSON.stringify({
      thread_id: threadId,
      stored,
      category,
      summary: stored > 0 ? "Streamed ingest complete" : "No chunks stored",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Ingest error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    const code = /too large/i.test(msg) ? 413 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status: code, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
