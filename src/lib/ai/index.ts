export type ChatMessage = { role: 'user'|'assistant'|'system'; content: string };

export async function chat(opts: { messages: ChatMessage[] }): Promise<{ text: string }> {
  // stub implementation – replace with real model call later
  const last = opts.messages.at(-1)?.content ?? '';
  return { text: `stub-reply: ${last.slice(0, 40)}` };
}
