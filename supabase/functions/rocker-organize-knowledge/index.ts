import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { ai } from "../_shared/ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { content } = await req.json();
    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { text, raw } = await ai.chat({
      role: 'knower',
      messages: [
        { role: 'system', content: 'You are Rocker. Organize content into knowledge base categories and suggest best folder path. Return a concise JSON with {category, confidence, suggested_paths: string[]}.' },
        { role: 'user', content }
      ],
      maxTokens: 600,
      temperature: 0.2
    });

    return new Response(JSON.stringify({ result: { choices: [{ message: { content: text } }] }, raw }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});