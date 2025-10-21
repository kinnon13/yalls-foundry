// supabase/functions/_shared/ai.ts
// Unified AI gateway for Rocker. Chooses provider via env and normalizes responses.

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';
export interface ChatMessage { role: ChatRole; content: string; name?: string }

function env(k: string): string | undefined {
  // Deno first, then fallback (useful for local tooling)
  // deno-lint-ignore no-explicit-any
  return (typeof Deno !== 'undefined' ? Deno.env.get(k) : undefined) || (globalThis as any)?.__env?.[k];
}

function pickProvider(): 'openai' | 'lovable' {
  const forced = env('AI_PROVIDER');
  if (forced === 'openai' || forced === 'lovable') return forced;
  if (env('OPENAI_API_KEY')) return 'openai';
  return 'lovable';
}

export async function aiChat(opts: {
  role?: 'user' | 'admin' | 'knower';
  messages: ChatMessage[];
  model?: string; // optional override
  maxTokens?: number;
}): Promise<string> {
  const provider = pickProvider();

  if (provider === 'openai') {
    const apiKey = env('OPENAI_API_KEY');
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

    const model = opts.model || env('OPENAI_CHAT_MODEL') || 'gpt-4o-mini';
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: opts.messages,
        max_tokens: opts.maxTokens ?? 800,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
    const j = await res.json();
    return j?.choices?.[0]?.message?.content ?? '';
  }

  // Default to Lovable AI Gateway (OpenAI-compatible shape)
  const lovableKey = env('LOVABLE_API_KEY');
  if (!lovableKey) throw new Error('LOVABLE_API_KEY not available');
  const model = opts.model || env('LOVABLE_CHAT_MODEL') || 'google/gemini-2.5-flash';

  const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages: opts.messages }),
  });
  if (!r.ok) throw new Error(`Lovable AI error ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j?.choices?.[0]?.message?.content ?? '';
}
