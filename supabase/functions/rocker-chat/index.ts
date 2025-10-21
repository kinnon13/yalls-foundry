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
    const message = (body.message || (Array.isArray(body.messages) ? body.messages.map((m: any) => m.content).join("\n\n") : "")).trim();

    if (!message) {
      return new Response(JSON.stringify({ error: "Missing message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = "You are Rocker, a proactive AI copilot. Be concise and actionable.";
    const authHeader = req.headers.get("Authorization") || "";

    // 1) Try streaming via proxy-openai using the user's saved key
    const proxyUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/proxy-openai`;
    const upstream = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: "/chat/completions",
        body: {
          model: "gpt-4o-mini",
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ]
        },
        keyName: "default"
      })
    });

    if (upstream.ok && upstream.body) {
      return new Response(upstream.body, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // 2) Fallback to Lovable AI gateway streaming if user key missing/invalid
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      const errText = await upstream.text().catch(() => "");
      return new Response(JSON.stringify({ error: errText || "AI is not configured" }), {
        status: upstream.status || 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gateway = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]
      }),
    });

    if (!gateway.ok || !gateway.body) {
      if (gateway.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (gateway.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits required. Please top up to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await gateway.text().catch(() => "");
      return new Response(JSON.stringify({ error: t || "AI gateway error" }), {
        status: gateway.status || 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(gateway.body, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e: any) {
    console.error("[rocker-chat] error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
