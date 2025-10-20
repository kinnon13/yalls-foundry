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

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  try {
    const { limit = 50, thread_id } = await req.json();

    // Get recent embedded knowledge
    let query = sb
      .from("rocker_knowledge")
      .select("id, content, created_at, metadata")
      .not("embedding", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (thread_id) {
      query = query.eq("thread_id", thread_id);
    }

    const { data: knowledge, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    if (!knowledge || knowledge.length === 0) {
      return new Response(JSON.stringify({ summary: "No embedded knowledge found." }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Combine content for summarization
    const combinedText = knowledge.map((k: any) => k.content).join("\n\n---\n\n");

    // Generate summary using OpenAI
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing and summarizing information. Create a comprehensive summary with key insights, themes, and actionable takeaways.",
          },
          {
            role: "user",
            content: `Analyze and summarize the following content:\n\n${combinedText}`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices[0].message.content;

    // Log to ledger
    try {
      await sb.from("ai_action_ledger").insert({
        agent: "rocker",
        action: "summarize_knowledge",
        input: { count: knowledge.length, thread_id },
        output: { summary_length: summary.length },
        result: "success",
      });
    } catch (e) {
      console.error("[log skipped]", e);
    }

    return new Response(JSON.stringify({ 
      summary,
      items_analyzed: knowledge.length,
      date_range: {
        oldest: knowledge[knowledge.length - 1]?.created_at,
        newest: knowledge[0]?.created_at,
      },
    }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[summarize-knowledge]", e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
