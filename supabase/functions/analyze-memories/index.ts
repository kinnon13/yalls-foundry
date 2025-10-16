/**
 * Analyze and backfill memories from conversation history
 * Called manually or via cron to process past conversations
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { createLogger } from "../_shared/logger.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

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
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use user_id as tenant_id (profiles table doesn't have tenant_id)
    const tenantId = user.id;

    // Ensure consent exists (required for RLS)
    log.info('Ensuring user consent exists');
    const { error: consentErr } = await supabaseClient
      .from('ai_user_consent')
      .upsert({
        tenant_id: tenantId,
        user_id: user.id,
        site_opt_in: true,
        policy_version: 'v1',
        consented_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id,user_id' });
    
    if (consentErr) {
      log.error('Consent upsert failed', consentErr);
      throw new Error(`Failed to ensure consent: ${consentErr.message}`);
    }

    // Get all user conversations
    const { data: conversations, error: convErr } = await supabaseClient
      .from('rocker_conversations')
      .select('content, role, created_at, session_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (convErr || !conversations) {
      throw new Error('Failed to load conversations');
    }

    log.info(`Analyzing ${conversations.length} messages for user ${user.id}`);

    // Group by session
    const sessions = new Map<string, any[]>();
    for (const msg of conversations) {
      if (!sessions.has(msg.session_id)) {
        sessions.set(msg.session_id, []);
      }
      sessions.get(msg.session_id)!.push(msg);
    }

    let totalExtracted = 0;

    // Process each session
    for (const [sessionId, messages] of sessions.entries()) {
      const userMessages = messages.filter(m => m.role === 'user');
      if (userMessages.length === 0) continue;

      const conversationText = messages
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');

      // Use AI to extract memories from the whole session
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `Extract ALL memorable facts about the user from this conversation. 

Categories to look for:
- **family**: Names, relationships, details about family members (mom, dad, siblings, etc.)
- **personal_info**: Name, age, location, birthday, job, occupation
- **preference**: What they like, dislike, prefer, avoid
- **goal**: Plans, ambitions, things they want to do
- **interest**: Hobbies, topics they're interested in
- **skill**: What they know, expertise, learning
- **project**: Projects they're working on
- **relationship**: Friends, colleagues, important people

Return a JSON array of memories. Be generous - capture anything that seems important about WHO this person is. Each memory:
{
  "key": "descriptive_key_like_mother_occupation_or_favorite_food",
  "type": "category_from_above",
  "value": "the actual fact or detail",
  "confidence": 0.6-1.0,
  "context": "brief context from conversation"
}

If NOTHING memorable, return [].`
            },
            {
              role: 'user',
              content: conversationText
            }
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        log.error('AI extraction failed', { status: response.status });
        continue;
      }

      const completion = await response.json();
      const content = completion.choices[0]?.message?.content;

      if (!content) continue;

      let memories: any[] = [];
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          memories = JSON.parse(jsonMatch[0]);
        }
      } catch (parseErr) {
        log.error('Failed to parse AI response', parseErr);
        continue;
      }

      // Store memories
      for (const mem of memories) {
        if (!mem.key || !mem.value || !mem.type) continue;

        // Check if exists
        const { data: existing } = await supabaseClient
          .from('ai_user_memory')
          .select('id')
          .eq('user_id', user.id)
          .eq('key', mem.key.toLowerCase().replace(/\s+/g, '_'))
          .maybeSingle();

        if (existing) {
          log.info('Memory exists, skipping', { key: mem.key });
          continue;
        }

        const { error: insertErr } = await supabaseClient.from('ai_user_memory').insert({
          user_id: user.id,
          tenant_id: tenantId,
          key: mem.key.toLowerCase().replace(/\s+/g, '_'),
          value: {
            content: mem.value,
            context: mem.context || '',
            session_id: sessionId,
            extracted_at: new Date().toISOString()
          },
          type: mem.type,
          confidence: mem.confidence || 0.7,
          source: 'chat',
          tags: [mem.type, 'ai_backfill'],
          namespace: 'personal'
        });

        if (insertErr) {
          log.error('Failed to insert memory', { 
            key: mem.key, 
            error: insertErr,
            code: insertErr.code,
            details: insertErr.details,
            hint: insertErr.hint
          });
        } else {
          log.info('Stored memory', { key: mem.key, type: mem.type });
          totalExtracted++;
        }
      }

      // Small delay between sessions to avoid rate limits
      await new Promise(r => setTimeout(r, 100));
    }

    log.info(`Backfill complete: ${totalExtracted} memories stored`);

    return new Response(
      JSON.stringify({ totalExtracted, success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    log.error('Error in analyze-memories', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});