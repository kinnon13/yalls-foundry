// supabase/functions/_shared/sse.ts
// SSE stream helper for AI responses

export function sseFromGenerator(gen: AsyncGenerator<any>) {
  const enc = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const evt of gen) {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(evt)}\n\n`));
          if (evt?.type === 'done') break;
        }
      } catch (e) {
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: 'error', data: String(e) })}\n\n`));
      } finally {
        controller.enqueue(enc.encode('data: [DONE]\n\n'));
        controller.close();
      }
    }
  });
}
