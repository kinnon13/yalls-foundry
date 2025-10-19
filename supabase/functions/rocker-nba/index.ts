import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate next best actions for this user.' }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate suggestions');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON from response
    let actions = [];
    try {
      actions = JSON.parse(content);
    } catch {
      // If not valid JSON, return empty array
      console.error('Failed to parse OpenAI response as JSON');
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
