// supabase/functions/rocker-process-file/index.ts
// POST { file_id?: string, text?: string, title?: string, source_id?: string }
// If file_id is provided, loads from rocker_files.text_content; otherwise uses {text,title}.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function chunk(text: string, size = 1800, overlap = 200) {
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    out.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!, // client key; RLS enforced for user
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const { file_id, text: rawText, title: rawTitle, source_id } = body ?? {};

    let title = (rawTitle ?? "").toString().trim();
    let text = (rawText ?? "").toString();

    if (!text && file_id) {
      // Load from rocker_files
      const { data: file, error } = await supabase
        .from("rocker_files")
        .select("id, title, text_content")
        .eq("id", file_id)
        .single();
      if (error || !file) {
        return new Response(JSON.stringify({ error: "File not found" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
      }
      text = file.text_content ?? "";
      if (!title) title = file.title ?? "Untitled";
    }

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "No text to process" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (!title) title = "Untitled";

    // Create a memory "summary" row (lightweight)
    const summary = text.length > 400 ? text.slice(0, 400) + "…" : text;
    const { data: mem, error: memErr } = await supabase
      .from("rocker_memories")
      .insert({
        user_id: user.id,
        source_id: source_id ?? file_id ?? null,
        kind: "doc",
        title,
        summary,
        keywords: [],
        importance: 5,
      })
      .select("id")
      .single();
    if (memErr) throw memErr;

    // Chunk and insert into rocker_knowledge with NULL embedding (for background worker)
    const pieces = chunk(text);
    const rows = pieces.map((content, idx) => ({
      user_id: user.id,
      source_id: source_id ?? file_id ?? null,
      memory_id: mem.id,
      chunk_index: idx,
      content,
      embedding: null,
      meta: { title, len: content.length },
    }));

    // Batch insert in small groups to keep memory low
    const BATCH = 50;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const { error } = await supabase.from("rocker_knowledge").insert(batch).select("id");
      if (error) throw error;
      inserted += batch.length;
    }

    return new Response(JSON.stringify({ ok: true, memory_id: mem.id, chunks: inserted, title }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[rocker-process-file] error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
