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
    const payload = await req.json().catch(() => ({}));
    const { message } = payload as { message?: string };
    console.log('[rocker-chat-simple] incoming', { hasMessage: !!message });
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

    // 1) Try user's OpenAI key via proxy-openai
    let reply = '';
    try {
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

      if (!error) {
        const json = typeof data === 'string' ? JSON.parse(data as string) : (data as any);
        reply = json?.choices?.[0]?.message?.content ?? '';
      } else {
        console.error('[rocker-chat-simple] proxy-openai error:', error.message);
      }
    } catch (e) {
      console.error('[rocker-chat-simple] proxy-openai threw:', e);
    }

    // 2) Fallback to Lovable AI gateway if no reply
    if (!reply) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: 'AI is not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are Rocker. Keep answers concise and actionable.' },
            { role: 'user', content: message }
          ],
        }),
      });

      if (!aiResp.ok) {
        const errText = await aiResp.text();
        console.error('[rocker-chat-simple] gateway error:', aiResp.status, errText);
        return new Response(errText || JSON.stringify({ error: 'AI gateway error' }), {
          status: aiResp.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const aiJson = await aiResp.json();
      reply = aiJson?.choices?.[0]?.message?.content ?? '';
    }

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