// supabase/functions/_shared/ai.ts
// One gateway for all AI calls used by Rocker. Deno/Edge-safe.

type Provider = 'openai' | 'lovable' | 'stub';
type Role = 'user' | 'admin' | 'knower';

export type Message = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
};

export type ToolSpec = { name: string; description?: string; parameters?: Record<string, any> };

const env = (k: string) =>
  (typeof Deno !== 'undefined' ? Deno.env.get(k) : undefined) ??
  (typeof process !== 'undefined' ? (process as any).env?.[k] : undefined) ??
  (globalThis as any)?.__env?.[k] ?? '';

const PROVIDER = (env('AI_PROVIDER') as Provider) || 'lovable';

const MODELS = {
  openai: {
    user:   { chat: 'gpt-4o-mini', embed: 'text-embedding-3-small',  tts: 'tts-1',     stt: 'whisper-1', image: 'gpt-image-1' },
    admin:  { chat: 'gpt-4o',      embed: 'text-embedding-3-large',  tts: 'tts-1-hd',  stt: 'whisper-1', image: 'gpt-image-1' },
    knower: { chat: 'gpt-4.1',     embed: 'text-embedding-3-large',  tts: 'tts-1',     stt: 'whisper-1', image: 'gpt-image-1' },
  },
  lovable: {
    user:   { chat: 'google/gemini-2.5-flash',      embed: 'google/text-embed',  tts: 'default', stt: 'default', image: 'default' },
    admin:  { chat: 'google/gemini-2.5-flash',      embed: 'google/text-embed',  tts: 'default', stt: 'default', image: 'default' },
    knower: { chat: 'google/gemini-2.5-flash',      embed: 'google/text-embed',  tts: 'default', stt: 'default', image: 'default' },
  },
  stub: {
    user:   { chat: 'stub', embed: 'stub', tts: 'stub', stt: 'stub', image: 'stub' },
    admin:  { chat: 'stub', embed: 'stub', tts: 'stub', stt: 'stub', image: 'stub' },
    knower: { chat: 'stub', embed: 'stub', tts: 'stub', stt: 'stub', image: 'stub' },
  }
} as const;

const m = MODELS[PROVIDER];

export const ai = {
  // ---------- CHAT (non-stream) ----------
  async chat(opts: {
    role: Role; messages: Message[]; tools?: ToolSpec[]; temperature?: number; maxTokens?: number;
  }): Promise<{ text: string; raw?: any }> {
    if (PROVIDER === 'stub') {
      return { text: '[stub] ' + (opts.messages.at(-1)?.content ?? ''), raw: { provider: 'stub' } };
    }
    if (PROVIDER === 'openai') {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env('OPENAI_API_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: m[opts.role].chat,
          messages: opts.messages,
          tools: opts.tools?.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } })),
          tool_choice: opts.tools?.length ? 'auto' : 'none',
          temperature: opts.temperature ?? 0.6,
          max_tokens: opts.maxTokens ?? 1200
        })
      });
      if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
      const j = await r.json();
      return { text: j.choices?.[0]?.message?.content ?? '', raw: j };
    }
    // lovable
    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env('LOVABLE_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: m[opts.role].chat,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.6,
        max_tokens: opts.maxTokens ?? 1200
      })
    });
    if (!r.ok) throw new Error(`Lovable ${r.status}: ${await r.text()}`);
    const j = await r.json();
    return { text: j.choices?.[0]?.message?.content ?? '', raw: j };
  },

  // ---------- CHAT (stream) ----------
  async *streamChat(opts: {
    role: Role; messages: Message[]; tools?: ToolSpec[]; temperature?: number;
  }): AsyncGenerator<{ type: 'text'|'tool_call'|'done'|'error'; data?: any }> {
    if (PROVIDER === 'stub') {
      yield { type: 'text', data: '[stub stream] ' + (opts.messages.at(-1)?.content ?? '') };
      yield { type: 'done' };
      return;
    }
    if (PROVIDER === 'openai') {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env('OPENAI_API_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: m[opts.role].chat,
          messages: opts.messages,
          tools: opts.tools?.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } })),
          tool_choice: opts.tools?.length ? 'auto' : 'none',
          temperature: opts.temperature ?? 0.6,
          stream: true
        })
      });
      if (!r.ok || !r.body) { yield { type: 'error', data: await r.text() }; return; }
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        for (const line of buf.split('\n')) {
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (payload === '[DONE]') { yield { type: 'done' }; continue; }
          try {
            const delta = JSON.parse(payload);
            const d = delta.choices?.[0]?.delta;
            if (d?.content) yield { type: 'text', data: d.content };
            if (d?.tool_calls?.length) yield { type: 'tool_call', data: d.tool_calls };
          } catch {}
        }
        buf = buf.slice(buf.lastIndexOf('\n') + 1);
      }
      return;
    }
    // lovable stream
    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env('LOVABLE_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: m[opts.role].chat,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.6,
        stream: true
      })
    });
    if (!r.ok || !r.body) { yield { type: 'error', data: await r.text() }; return; }
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      for (const line of buf.split('\n')) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') { yield { type: 'done' }; continue; }
        try {
          const delta = JSON.parse(payload);
          const d = delta.choices?.[0]?.delta;
          if (d?.content) yield { type: 'text', data: d.content };
        } catch {}
      }
      buf = buf.slice(buf.lastIndexOf('\n') + 1);
    }
  },

  // ---------- EMBEDDINGS ----------
  async embed(role: Role, inputs: string[]) {
    if (PROVIDER === 'stub') return inputs.map(() => Array(8).fill(0.01));
    if (PROVIDER === 'openai') {
      const r = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env('OPENAI_API_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: m[role].embed, input: inputs })
      });
      if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
      const j = await r.json();
      return j.data.map((d: any) => d.embedding as number[]);
    }
    // lovable uses OpenAI-compatible API
    const r = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env('LOVABLE_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: m[role].embed, input: inputs })
    });
    if (!r.ok) throw new Error(`Lovable ${r.status}: ${await r.text()}`);
    const j = await r.json();
    return j.data.map((d: any) => d.embedding as number[]);
  },

  // ---------- MODERATION ----------
  async moderate(input: string) {
    if (PROVIDER === 'stub') return { allowed: true, provider: 'stub' };
    if (PROVIDER === 'openai') {
      const r = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env('OPENAI_API_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'omni-moderation-latest', input })
      });
      if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
      return await r.json();
    }
    throw new Error('Lovable moderation not implemented');
  },

  // ---------- TTS (Speech synthesis) ----------
  async tts(role: Role, text: string, voice?: string): Promise<ArrayBuffer> {
    if (PROVIDER === 'stub') {
      const enc = new TextEncoder(); return enc.encode('[stub audio]').buffer;
    }
    if (PROVIDER === 'openai') {
      const r = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env('OPENAI_API_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: m[role].tts, input: text, voice: voice ?? 'alloy', response_format: 'mp3' })
      });
      if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
      return await r.arrayBuffer();
    }
    throw new Error('Lovable TTS not implemented');
  },
};

// Legacy export for backward compatibility
export type ChatRole = Message['role'];
export interface ChatMessage { role: ChatRole; content: string; name?: string }
export async function aiChat(opts: {
  role?: 'user' | 'admin' | 'knower';
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  const result = await ai.chat({ role: opts.role || 'user', messages: opts.messages as Message[], maxTokens: opts.maxTokens });
  return result.text;
}
