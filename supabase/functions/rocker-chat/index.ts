import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { ai } from "../_shared/ai.ts";
import { sseFromGenerator } from "../_shared/sse.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const message = (body.message || (Array.isArray(body.messages) ? body.messages.map((m: any) => m.content).join("\n\n") : "")).trim();

    if (!message) {
      return new Response(JSON.stringify({ error: "Missing message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = "You are Rocker, a proactive AI copilot for Y'all's. Be concise and actionable.";
    const stream = ai.streamChat({
      role: 'user',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7
    });

    return new Response(sseFromGenerator(stream), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e: any) {
    console.error("[rocker-chat] error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
