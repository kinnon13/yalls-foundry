import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } }
    );

    const { data, error } = await supabase.functions.invoke('proxy-openai', {
      headers: { Authorization: req.headers.get('Authorization') || '' },
      body: {
        path: '/v1/chat/completions',
        keyName: 'openai',
        body: {
          model: 'gpt-5-mini-2025-08-07',
          messages: [
            { role: 'system', content: 'You are Rocker. Do web-style research using your knowledge. Provide concise, actionable findings with sources if known.' },
            { role: 'user', content: `Type: ${body.research_type}\nContext: ${body.context || 'n/a'}\nQuery: ${body.query}` }
          ],
          max_completion_tokens: 800
        }
      }
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ research: (data as any)?.choices?.[0]?.message?.content || '' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});