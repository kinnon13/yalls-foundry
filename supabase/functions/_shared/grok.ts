/**
 * Grok API Client
 * xAI's Grok-2 model integration
 */

export interface GrokMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GrokChatParams {
  apiKey: string;
  messages: GrokMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface GrokChatResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call Grok chat completions API
 */
export async function grokChat(params: GrokChatParams): Promise<GrokChatResponse> {
  const {
    apiKey,
    messages,
    model = 'grok-2',
    maxTokens = 32000,
    temperature = 0.7,
    stream = false
  } = params;

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok API error ${response.status}: ${error}`);
  }

  return await response.json() as GrokChatResponse;
}

/**
 * Streaming variant (returns ReadableStream)
 */
export async function grokChatStream(params: GrokChatParams): Promise<ReadableStream> {
  const {
    apiKey,
    messages,
    model = 'grok-2',
    maxTokens = 32000,
    temperature = 0.7
  } = params;

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: true
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok API error ${response.status}: ${error}`);
  }

  return response.body!;
}
