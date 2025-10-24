import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { text, voice, rate, pitch } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const elevenKey = Deno.env.get('ELEVENLABS_API_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    // Prefer ElevenLabs if configured
    if (elevenKey) {
      const voiceMap: Record<string, string> = {
        aria: '9BWtsMINqrJLrRacOk9x', roger: 'CwhRBWXzGAHq8TQ4Fs17', sarah: 'EXAVITQu4vr4xnSDxMaL', laura: 'FGY2WhTYpPnrIDTdsKH5', charlie: 'IKne3meq5aSn9XLyUdCD',
        george: 'JBFqnCBsd6RMkjVDRZzb', callum: 'N2lVS1w4EtoT3dr4eOWO', river: 'SAz9YHcvj6GT2YYXdXww', liam: 'TX3LPaxmHKxFdv7VOQHJ', charlotte: 'XB0fDUnXU5powFXDhCwa',
        alice: 'Xb7hH8MSUJpSbSDYk0k2', matilda: 'XrExE9yKIg1WjnnlVkGX', will: 'bIHbv24MWmeRgasZH58o', jessica: 'cgSgspJ2msm6clMCkdW9', eric: 'cjVigY5qzO86Huf0OWal',
        chris: 'iP95p4xoKVk53GoZ742B', brian: 'nPczCjzI2devNBz1zQrb', daniel: 'onwK4e9ZLuTAKqWW03F9', lily: 'pFZP5JQG7iQjIQuC4Bku', bill: 'pqHfZKP75CvOlQylNhV4',
      };

      const voiceId = voice && (voiceMap[String(voice).toLowerCase()] || voice) || voiceMap['aria'];

      const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_id: 'eleven_multilingual_v2',
          text,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        return new Response(JSON.stringify({ error: `ElevenLabs error: ${resp.status} ${t}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const arrayBuffer = await resp.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      return new Response(JSON.stringify({ audioContent: base64 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fallback: OpenAI TTS if configured
    if (openaiKey) {
      const validVoices = new Set(['alloy','ash','ballad','coral','echo','sage','shimmer','verse']);
      const voiceName = voice && validVoices.has(String(voice)) ? String(voice) : 'alloy';

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
    }

    return new Response(JSON.stringify({ error: 'No TTS provider configured. Add ELEVENLABS_API_KEY or OPENAI_API_KEY.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[text-to-speech] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});