// supabase/functions/_shared/ai.ts
// LOVABLE AI GATEWAY - WORKING VERSION
// Uses Gemini for all AI operations

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

const LOVABLE_MODELS = {
  user:   'google/gemini-2.5-flash-lite',
  admin:  'google/gemini-2.5-flash',
  knower: 'google/gemini-2.5-pro',
} as const;

const GROK_MODELS = {
  user:   'grok-2-mini',
  admin:  'grok-2',
  knower: 'grok-2-vision',
} as const;

export const ai = {
  async chat(opts: {
    role: Role; messages: Message[]; tools?: ToolSpec[]; temperature?: number; maxTokens?: number; useGrok?: boolean;
  }): Promise<{ text: string; raw?: any }> {
    const grokKey = env('GROK_API_KEY');
    const lovableApiKey = env('LOVABLE_API_KEY');
    
    // ANDY USES GROK - others use Lovable
    const useGrok = opts.useGrok || opts.role === 'knower';
    
    if (useGrok && grokKey) {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${grokKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: GROK_MODELS[opts.role],
          messages: opts.messages,
          temperature: opts.temperature ?? 0.7,
          max_tokens: opts.maxTokens || 32000
        })
      });

      if (!response.ok) throw new Error(`Grok AI error: ${response.status}`);
      const data = await response.json();
      return { text: data.choices[0].message.content, raw: data };
    }

    // Fallback to Lovable AI
    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY not configured');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: LOVABLE_MODELS[opts.role],
        messages: opts.messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens || 2000
      })
    });

    if (!response.ok) throw new Error(`Lovable AI error: ${response.status}`);
    const data = await response.json();
    return { text: data.choices[0].message.content, raw: data };
  },

  async *streamChat(opts: {
    role: Role; messages: Message[]; tools?: ToolSpec[]; temperature?: number; useGrok?: boolean;
  }): AsyncGenerator<{ type: 'text'|'tool_call'|'done'|'error'; data?: any }> {
    const grokKey = env('GROK_API_KEY');
    const lovableApiKey = env('LOVABLE_API_KEY');
    
    // ANDY USES GROK - others use Lovable
    const useGrok = opts.useGrok || opts.role === 'knower';
    
    if (useGrok && grokKey) {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${grokKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: GROK_MODELS[opts.role],
          messages: opts.messages,
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
      return;
    }

    // Fallback to Lovable AI
    if (!lovableApiKey) {
      yield { type: 'error', data: 'LOVABLE_API_KEY not configured' };
      return;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: LOVABLE_MODELS[opts.role],
        messages: opts.messages,
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
  },

  async embed(role: Role, inputs: string[]) {
    const lovableApiKey = env('LOVABLE_API_KEY');
    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY not configured');

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: inputs
      })
    });

    if (!response.ok) throw new Error(`Embedding error: ${response.status}`);
    const data = await response.json();
    return data.data.map((d: any) => d.embedding as number[]);
  },

  async moderate(input: string) {
    return { allowed: true, reason: 'Moderation not implemented' };
  },

  async tts(role: Role, text: string, voice?: string): Promise<ArrayBuffer> {
    throw new Error('TTS not implemented - use ElevenLabs directly');
  },
};

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
