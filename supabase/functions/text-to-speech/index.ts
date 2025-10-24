import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { text, voice = 'alloy', rate, pitch } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const validVoices = new Set(['alloy','ash','ballad','coral','echo','sage','shimmer','verse']);
    const voiceName = validVoices.has(String(voice)) ? String(voice) : 'alloy';

    const resp = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'tts-1', input: text, voice: voiceName, response_format: 'mp3' }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: `OpenAI error: ${resp.status} ${t}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const arrayBuffer = await resp.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return new Response(JSON.stringify({ audioContent: base64 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[text-to-speech] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});