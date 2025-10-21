import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { ai } from "../_shared/ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, contextType, contextId } = await req.json();

    // Get user context from Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch recent activity
    const { data: events } = await supabase
      .from('rocker_events')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(10);

    const systemPrompt = `You are Rocker, an AI assistant for Y'alls - a horse breeding platform. 
Analyze the user's recent activity and suggest 3-5 actionable next steps.

Context Type: ${contextType}
Context ID: ${contextId}

Recent Activity:
${JSON.stringify(events || [], null, 2)}

Return a JSON array of actions with this structure:
[
  {
    "id": "unique-id",
    "title": "Action title",
    "description": "Why this matters",
    "priority": "high" | "medium" | "low",
    "category": "crm" | "listings" | "events" | "earnings" | "farm-ops",
    "actionId": "action_identifier",
    "params": {}
  }
]`;

    const { text } = await ai.chat({
      role: 'user',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate next best actions for this user.' }
      ],
      temperature: 0.7,
      maxTokens: 1200
    });
    
    // Parse JSON from response
    let actions = [];
    try {
      actions = JSON.parse(text);
    } catch {
      console.error('Failed to parse AI response as JSON');
      actions = [];
    }

    // Log to action ledger
    await supabase.from('ai_action_ledger').insert({
      user_id: userId,
      agent: 'rocker',
      action: 'generate_nba',
      input: { contextType, contextId },
      output: { actions },
      result: 'success'
    });

    return new Response(JSON.stringify({ actions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in rocker-nba function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      actions: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
