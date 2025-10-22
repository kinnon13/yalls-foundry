/**
 * CTM Extract Goals
 * Extracts goals and steps from conversation messages
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { conversationId, tenantId } = await req.json();

    // Fetch recent messages
    const { data: messages, error: msgError } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (msgError) throw msgError;

    // Simple goal extraction (in production, use LLM)
    const goalKeywords = ['todo', 'task', 'need to', 'should', 'must', 'goal'];
    const goals: any[] = [];

    for (const msg of messages || []) {
      const content = msg.content.toLowerCase();
      const hasGoal = goalKeywords.some(kw => content.includes(kw));
      
      if (hasGoal && msg.role === 'user') {
        goals.push({
          tenant_id: tenantId,
          conversation_id: conversationId,
          title: msg.content.substring(0, 100),
          description: msg.content,
          status: 'active',
          priority: 5,
        });
      }
    }

    // Insert goals
    if (goals.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('ai_goals')
        .insert(goals)
        .select();

      if (insertError) throw insertError;

      console.log(`[CTM Extract] Created ${inserted?.length} goals`);
      
      return new Response(JSON.stringify({ 
        extracted: inserted?.length,
        goals: inserted 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ extracted: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[CTM Extract] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
