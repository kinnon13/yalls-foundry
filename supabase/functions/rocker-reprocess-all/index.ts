import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { ai } from "../_shared/ai.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { instruction } = await req.json().catch(() => ({ instruction: 'Reprocess all items and fix inconsistencies.' }));

    const { text } = await ai.chat({
      role: 'knower',
      messages: [
        { role: 'system', content: 'You are Rocker. Plan a reprocessing strategy across stored items. Output bullet list of steps to execute, idempotent and safe.' },
        { role: 'user', content: instruction }
      ],
      maxTokens: 800,
      temperature: 0.2
    });

    return new Response(JSON.stringify({ plan: text }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});