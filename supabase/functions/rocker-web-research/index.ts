import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ai } from "../_shared/ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResearchRequest {
  query: string;
  context?: string;
  research_type: 'feature_gap' | 'best_practice' | 'alternative' | 'troubleshooting';
  user_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as ResearchRequest;
    if (!body?.query) {
      return new Response(JSON.stringify({ error: 'query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { text } = await ai.chat({
      role: 'knower',
      messages: [
        { role: 'system', content: 'You are Rocker. Do web-style research using your knowledge. Provide concise, actionable findings with sources if known.' },
        { role: 'user', content: `Type: ${body.research_type}\nContext: ${body.context || 'n/a'}\nQuery: ${body.query}` }
      ],
      maxTokens: 800,
      temperature: 0.3
    });

    return new Response(JSON.stringify({ research: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});