import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { createLogger } from "../_shared/logger.ts";
import { ai } from "../_shared/ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const log = createLogger('analyze-memories');

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tenantId = user.id;

    // Ensure consent
    await supabaseClient.from('ai_user_consent').upsert({
      tenant_id: tenantId,
      user_id: user.id,
      site_opt_in: true,
      policy_version: 'v1',
      consented_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id,user_id' });

    const { data: conversations } = await supabaseClient
      .from('rocker_conversations')
      .select('content, role, created_at, session_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (!conversations) throw new Error('Failed to load conversations');

    const sessions = new Map<string, any[]>();
    for (const msg of conversations) {
      if (!sessions.has(msg.session_id)) sessions.set(msg.session_id, []);
      sessions.get(msg.session_id)!.push(msg);
    }

    let totalExtracted = 0;

    for (const [sessionId, messages] of sessions.entries()) {
      const conversationText = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');

      const { text } = await ai.chat({
        role: 'knower',
        messages: [
          { role: 'system', content: `Extract memorable facts as JSON array: [{ key, type, value, confidence, context }]. Types: family, personal_info, preference, goal, interest, skill, project, relationship` },
          { role: 'user', content: conversationText }
        ],
        maxTokens: 800
      });

      let memories: any[] = [];
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) memories = JSON.parse(jsonMatch[0]);
      } catch {}

      for (const mem of memories) {
        if (!mem.key || !mem.value || !mem.type) continue;

        const { data: existing } = await supabaseClient.from('ai_user_memory').select('id').eq('user_id', user.id).eq('key', mem.key.toLowerCase().replace(/\s+/g, '_')).maybeSingle();
        if (existing) continue;

        const { error: insertErr } = await supabaseClient.from('ai_user_memory').insert({
          user_id: user.id,
          tenant_id: tenantId,
          key: mem.key.toLowerCase().replace(/\s+/g, '_'),
          value: { content: mem.value, context: mem.context || '', session_id: sessionId, extracted_at: new Date().toISOString() },
          type: mem.type,
          confidence: mem.confidence || 0.7,
          source: 'chat',
          tags: [mem.type, 'ai_backfill'],
          namespace: 'personal'
        });

        if (!insertErr) totalExtracted++;
      }
      await new Promise(r => setTimeout(r, 100));
    }

    return new Response(JSON.stringify({ totalExtracted, success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log.error('Error in analyze-memories', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
