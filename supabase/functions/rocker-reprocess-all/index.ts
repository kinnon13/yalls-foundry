import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { instruction } = await req.json().catch(() => ({ instruction: 'Reprocess all items and fix inconsistencies.' }));

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
            { role: 'system', content: 'You are Rocker. Plan a reprocessing strategy across stored items. Output bullet list of steps to execute, idempotent and safe.' },
            { role: 'user', content: instruction }
          ],
          max_completion_tokens: 800
        }
      }
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ plan: (data as any)?.choices?.[0]?.message?.content || '' }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});