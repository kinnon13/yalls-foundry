import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ai } from "../_shared/ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { topic } = await req.json();
    if (!topic || typeof topic !== 'string') {
      return new Response(JSON.stringify({ error: 'topic is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { text } = await ai.chat({
      role: 'user',
      messages: [
        { role: 'system', content: 'You are Rocker. Suggest 3-5 social post ideas with hooks, outlines, and CTAs. Return as markdown list.' },
        { role: 'user', content: topic }
      ],
      maxTokens: 600,
      temperature: 0.7
    });

    return new Response(JSON.stringify({ suggestions: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});