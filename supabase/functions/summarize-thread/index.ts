import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { thread_id, take = 60 } = await req.json();
    if (!thread_id) {
      return new Response(JSON.stringify({ error: "thread_id required" }), { status: 400, headers: CORS });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });

    // Prefer embedded chunks first; otherwise fall back to order
    const { data, error } = await supabase
      .from("rocker_knowledge")
      .select("chunk_index, content, embedding")
      .eq("meta->>thread_id", thread_id)
      .order("embedding", { ascending: true, nullsFirst: false }) // embedded first
      .order("chunk_index", { ascending: true })
      .limit(take);

    if (error) throw error;
    if (!data?.length) {
      return new Response(JSON.stringify({ error: "No chunks found for thread_id" }), { status: 404, headers: CORS });
    }

    const corpus = data.map(r => `[#${r.chunk_index}] ${r.content}`).join("\n\n");

    const prompt = [
      { role: "system", content: "You are Rocker. Summarize clearly. Output: TL;DR, 5–10 Key Points, Entities, Action Items. Cite chunk indices like [#12] inline." },
      { role: "user", content: `Summarize this:\n\n${corpus}` }
    ];

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.2, messages: prompt, max_tokens: 900 })
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("OpenAI API error:", resp.status, errorText);
      return new Response(JSON.stringify({ error: `OpenAI API error: ${errorText}` }), { status: 500, headers: CORS });
    }

    const json = await resp.json();
    const summary = json.choices?.[0]?.message?.content ?? "";

    // Log for audit
    await supabase.from("ai_action_ledger").insert({
      user_id: user.id,
      agent: "rocker",
      action: "summarize_thread",
      input: { thread_id, take },
      output: { chars: corpus.length, summary_length: summary.length },
      result: "success"
    }).catch((e) => console.error("Failed to log action:", e));

    return new Response(JSON.stringify({ thread_id, summary }), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("Summarize thread error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), { status: 500, headers: CORS });
  }
});
