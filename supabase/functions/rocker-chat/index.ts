import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSystemPrompt(actorRole: string | undefined, knowledgeContext?: string) {
  const base = actorRole === 'admin'
    ? "You are Admin Rocker, a precise, security-conscious operator. Be concise and confirm sensitive operations."
    : actorRole === 'knower'
      ? "You are Andy, a global intelligence system. Provide analytical, pattern-focused answers using only anonymized knowledge."
      : "You are Rocker, a proactive personal AI. Keep answers clear, helpful, and actionable.";
  const ctx = knowledgeContext?.trim()
    ? `\n\nKnowledge Context (read-only, may be partial):\n${knowledgeContext}\n\nWhen relevant, cite the source title and URI.`
    : '';
  return base + ctx;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const actor_role = body.actor_role || 'user';
    const topK = Math.min(8, body.topK || 6);

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Missing messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';

    // Build Supabase client with auth from caller
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );

    // Try to fetch KB context (best-effort)
    let knowledgeContext = '';
    try {
      // Get embedding via Lovable gateway (OpenAI-compatible embeddings)
      const embedResp = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'google/text-embed', input: [lastUserMsg] }),
      });
      if (embedResp.ok) {
        const ej = await embedResp.json();
        const queryEmbedding = ej.data?.[0]?.embedding;
        if (Array.isArray(queryEmbedding)) {
          // Prefer new KB
          const { data: kbMatches } = await supabase.rpc('match_kb_chunks' as any, {
            query_embedding: queryEmbedding,
            match_threshold: 0.6,
            match_count: topK,
          });
          // Fall back to legacy KB if no results
          let lines: string[] = [];
          if (kbMatches?.length) {
            lines = kbMatches.map((m: any, i: number) => `#${i + 1} ${m.title || ''} (${m.uri || ''})\n${m.content}`);
          } else {
            const { data: legacy } = await supabase.rpc('match_knowledge_chunks' as any, {
              query_embedding: queryEmbedding,
              match_threshold: 0.6,
              match_count: topK,
            });
            if (legacy?.length) {
              lines = legacy.map((m: any, i: number) => `#${i + 1} ${m.title || ''} (${m.item_uri || m.uri || ''})\n${m.content || m.text}`);
            }
          }
          knowledgeContext = lines.slice(0, topK).join('\n\n');
        }
      }
    } catch (e) {
      console.warn('[rocker-chat] KB context lookup failed:', e);
    }

    // Prepare system message with persona and KB context
    const system = { role: 'system', content: getSystemPrompt(actor_role, knowledgeContext) } as const;

    // Optional vision support: if body.images provided, attach to last user message (OpenAI-compatible format)
    const images: string[] = Array.isArray(body.images) ? body.images : [];
    const enhancedMessages = messages.map((m: any) => ({ role: m.role, content: m.content }));
    if (images.length > 0 && enhancedMessages.length > 0) {
      const lastIdx = enhancedMessages.length - 1;
      enhancedMessages[lastIdx] = {
        role: enhancedMessages[lastIdx].role,
        content: [
          { type: 'text', text: enhancedMessages[lastIdx].content },
          ...images.map((url) => ({ type: 'image_url', image_url: { url } }))
        ]
      } as any;
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        stream: true,
        messages: [system, ...enhancedMessages],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const t = await response.text();
      console.error('AI gateway error:', response.status, t);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return the AI gateway SSE stream directly (OpenAI-compatible)
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch (e: any) {
    console.error('[rocker-chat] error:', e);
    return new Response(JSON.stringify({ error: e.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
