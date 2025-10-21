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
    const { message, thread_id } = payload as { message?: string; thread_id?: string };
    console.log('[rocker-chat-simple] incoming', { hasMessage: !!message, hasThread: !!thread_id });
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

    // Persist user message when thread provided
    if (thread_id) {
      try {
        await supabase.from('rocker_messages').insert({
          thread_id,
          role: 'user',
          content: message,
          meta: null,
        });
      } catch (e) {
        console.error('[rocker-chat-simple] failed to insert user message', e);
      }
    }

    // 1) Try user's OpenAI key via proxy-openai (try both key names)
    let reply = '';
    const tryProxy = async (keyName: string) => {
      try {
        const { data, error } = await supabase.functions.invoke('proxy-openai', {
          body: {
            path: '/chat/completions',
            keyName,
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
          return json?.choices?.[0]?.message?.content ?? '';
        } else {
          console.error('[rocker-chat-simple] proxy-openai error:', error.message, `(keyName=${keyName})`);
          return '';
        }
      } catch (e) {
        console.error('[rocker-chat-simple] proxy-openai threw:', e, `(keyName=${keyName})`);
        return '';
      }
    };

    reply = await tryProxy('openai');
    if (!reply) reply = await tryProxy('default');

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

    // Persist assistant reply
    if (thread_id && reply) {
      try {
        await supabase.from('rocker_messages').insert({
          thread_id,
          role: 'assistant',
          content: reply,
          meta: null,
        });
      } catch (e) {
        console.error('[rocker-chat-simple] failed to insert assistant message', e);
      }
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