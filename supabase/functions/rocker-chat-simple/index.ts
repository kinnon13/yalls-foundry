import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiChat } from "../_shared/ai.ts";

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

    const { data: { user } } = await supabase.auth.getUser();

    // Persist user message when thread provided
    if (thread_id) {
      try {
        await supabase.from('rocker_messages').insert({
          thread_id,
          user_id: user?.id,
          role: 'user',
          content: message,
          meta: {},
        });
      } catch (e) {
        console.error('[rocker-chat-simple] failed to insert user message', e);
      }
    }

    // Unified AI gateway call
    let reply = '';
    try {
      reply = await aiChat({
        role: 'user',
        messages: [
          { role: 'system', content: 'You are Rocker. Keep answers concise and actionable.' },
          { role: 'user', content: message }
        ],
      });
    } catch (e) {
      console.error('[rocker-chat-simple] aiChat failed:', e);
      return new Response(JSON.stringify({ error: 'AI call failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Persist assistant reply
    if (thread_id && reply) {
      try {
        await supabase.from('rocker_messages').insert({
          thread_id,
          user_id: user?.id,
          role: 'assistant',
          content: reply,
          meta: {},
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