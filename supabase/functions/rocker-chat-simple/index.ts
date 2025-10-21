import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { message } = await req.json();
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'message is required' }), {
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
      body: {
        path: '/chat/completions',
        keyName: 'openai',
        body: {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are Rocker. Keep answers concise and actionable.' },
            { role: 'user', content: message }
          ],
          max_tokens: 500,
        }
      },
      headers: { Authorization: req.headers.get('Authorization') || '' }
    });

    if (error) {
      let details: any = null;
      try { details = typeof data === 'string' ? JSON.parse(data as string) : data; } catch {}
      const errPayload = details ?? { error: error.message };
      return new Response(JSON.stringify(errPayload), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const reply = (data as any)?.choices?.[0]?.message?.content ?? '';
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});