import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const { audioBase64, label } = await req.json();
    if (!audioBase64) {
      return new Response(JSON.stringify({ error: 'audioBase64 is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization') || '';
    const anon = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await anon.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Decode base64 audio
    const binaryString = atob(audioBase64);
    const audioBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      audioBytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to storage bucket
    const filename = `voice-samples/${user.id}/${Date.now()}.webm`;
    const { error: uploadError } = await supabase.storage
      .from('voice-samples')
      .upload(filename, audioBytes, { contentType: 'audio/webm', upsert: false });

    if (uploadError) {
      return new Response(JSON.stringify({ error: `Upload failed: ${uploadError.message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: urlData } = supabase.storage.from('voice-samples').getPublicUrl(filename);

    // Create or update voice profile
    await supabase.from('voice_profiles' as any).upsert({
      user_id: user.id,
      label: label || 'Default',
      sample_url: urlData.publicUrl,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    // Log event
    await supabase.from('voice_recognition_events' as any).insert({
      user_id: user.id,
      kind: 'enroll',
      sample_url: urlData.publicUrl,
      metadata: { label: label || 'Default' },
    });

    return new Response(JSON.stringify({ ok: true, url: urlData.publicUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[voice-enroll] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});