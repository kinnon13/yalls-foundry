import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } }
  );

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.user_id as string | undefined;
    const sessionId = body.session_id as string | undefined;
    const message = (body.message || (Array.isArray(body.messages) ? body.messages.map((m: any) => m.content).join("\n\n") : "")).trim();

    if (!message) {
      return new Response(JSON.stringify({ error: "Missing message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve auth user (if available)
    const { data: authUser } = await supabase.auth.getUser();
    const resolvedUserId = userId || authUser.user?.id || null;

    // Basic system prompt focused on proactivity and clarifying questions
    const systemPrompt = "You are Rocker, a proactive AI copilot. Be concise, take initiative, and end with a short plan beginning with: 'Next I'm going to:'";

    // Use proxy-openai to access user's OpenAI key
    const aiResp = await supabase.functions.invoke("proxy-openai", {
      body: {
        path: "/chat/completions",
        method: "POST",
        body: {
          model: "gpt-5-mini-2025-08-07",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          temperature: 0.4,
        },
        keyName: "default"
      }
    });

    if (aiResp.error) {
      console.error("OpenAI proxy error:", aiResp.error);
      return new Response(JSON.stringify({ error: aiResp.error.message || "OpenAI API error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = aiResp.data;
    const reply: string = data?.choices?.[0]?.message?.content || "";

    // Optional: log action
    try {
      await supabaseService.from("ai_action_ledger").insert({
        user_id: resolvedUserId,
        agent: "rocker",
        action: "chat",
        input: { session_id: sessionId, message },
        output: { reply },
        result: "success",
      });
    } catch (e) {
      console.warn("[rocker-chat] failed to log action:", e);
    }

    return new Response(
      JSON.stringify({ reply, actions: [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("[rocker-chat] error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
