// supabase/functions/_shared/ai.ts
// ONE AI GATEWAY - GROK ONLY
// All AI reasoning goes through Grok API

import { grokChat } from './grok.ts';

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

// Grok models for different roles
const GROK_MODELS = {
  user:   'grok-4-fast-non-reasoning',  // Fast for simple queries
  admin:  'grok-4-fast-reasoning',      // Reasoning for admin tasks
  knower: 'grok-4-fast-reasoning',      // Full reasoning for Andy
} as const;

export const ai = {
  // ---------- CHAT (non-stream) - ALL GROK ----------
  async chat(opts: {
    role: Role; messages: Message[]; tools?: ToolSpec[]; temperature?: number; maxTokens?: number;
  }): Promise<{ text: string; raw?: any }> {
    const grokApiKey = env('GROK_API_KEY');
    if (!grokApiKey) {
      throw new Error('GROK_API_KEY not configured');
    }

    const model = GROK_MODELS[opts.role];
    
    const response = await grokChat({
      apiKey: grokApiKey,
      model,
      messages: opts.messages.map(m => ({
        role: m.role === 'system' ? 'system' : m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      })),
      maxTokens: opts.maxTokens || 2000,
      temperature: opts.temperature ?? 0.7
    });

    return { 
      text: response.choices[0].message.content, 
      raw: response 
    };
  },

  // ---------- CHAT (stream) - GROK STREAMING ----------
  async *streamChat(opts: {
    role: Role; messages: Message[]; tools?: ToolSpec[]; temperature?: number;
  }): AsyncGenerator<{ type: 'text'|'tool_call'|'done'|'error'; data?: any }> {
    const grokApiKey = env('GROK_API_KEY');
    if (!grokApiKey) {
      yield { type: 'error', data: 'GROK_API_KEY not configured' };
      return;
    }

    try {
      const model = GROK_MODELS[opts.role];
      
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${grokApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: opts.messages.map(m => ({
            role: m.role === 'system' ? 'system' : m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          })),
          temperature: opts.temperature ?? 0.7,
          stream: true
        })
      });

      if (!response.ok || !response.body) {
        yield { type: 'error', data: await response.text() };
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            yield { type: 'done' };
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.content) {
              yield { type: 'text', data: delta.content };
            }
          } catch {}
        }
      }
    } catch (error) {
      yield { type: 'error', data: error instanceof Error ? error.message : 'Stream failed' };
    }
  },

  // ---------- EMBEDDINGS - STILL USE OPENAI ----------
  async embed(role: Role, inputs: string[]) {
    const openaiKey = env('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('Embeddings unavailable: missing OPENAI_API_KEY.');
    }

    const model = role === 'admin' ? 'text-embedding-3-large' : 'text-embedding-3-small';

    const r = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input: inputs })
    });
    if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
    const j = await r.json();
    return j.data.map((d: any) => d.embedding as number[]);
  },

  // ---------- MODERATION - GROK ----------
  async moderate(input: string) {
    const grokApiKey = env('GROK_API_KEY');
    if (!grokApiKey) {
      return { allowed: true, reason: 'Moderation unavailable' };
    }

    try {
      const response = await grokChat({
        apiKey: grokApiKey,
        model: 'grok-4-fast-non-reasoning',
        messages: [
          {
            role: 'system',
            content: 'You are a content moderator. Respond with ONLY "SAFE" or "UNSAFE" followed by a reason if unsafe.'
          },
          {
            role: 'user',
            content: `Moderate this content: ${input}`
          }
        ],
        maxTokens: 100,
        temperature: 0.1
      });

      const result = response.choices[0].message.content.toLowerCase();
      return {
        allowed: result.startsWith('safe'),
        reason: result
      };
    } catch {
      return { allowed: true, reason: 'Moderation check failed' };
    }
  },

  // ---------- TTS (Speech synthesis) - NOT IMPLEMENTED ----------
  async tts(role: Role, text: string, voice?: string): Promise<ArrayBuffer> {
    throw new Error('TTS not implemented - use ElevenLabs directly');
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
