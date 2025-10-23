/**
 * USER ROCKER CHAT - USER LEVEL AI
 * Personal assistant for regular users
 * Tasks, preferences, daily needs - NO system access
 * Completely separate from Super Andy and Admin Rocker
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { messages } = await req.json();
    
    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY not configured');

    const authHeader = req.headers.get('Authorization');
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } }
    });
    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Log to monitoring
    await supabase.from('ai_monitoring').insert({
      function_name: 'user-rocker-chat',
      user_id: user.id,
      request_type: 'user_chat',
      started_at: new Date().toISOString()
    });

    // Build USER context (personal data only, NO system access)
    let context = '';

    // Recent chat
    const { data: history } = await supabase
      .from('rocker_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (history?.length) {
      context += '\n## Recent Chat:\n' + history.reverse().map(m => `[${m.role}] ${m.content}`).join('\n');
    }

    // User preferences
    const { data: prefs } = await supabase
      .from('rocker_long_memory')
      .select('*')
      .eq('user_id', user.id)
      .eq('kind', 'preference')
      .limit(20);
    
    if (prefs?.length) {
      context += '\n## Your Preferences:\n' + prefs.map(p => `${p.key}: ${p.value}`).join('\n');
    }

    // User tasks
    const { data: tasks } = await supabase
      .from('rocker_tasks')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['open', 'doing'])
      .limit(20);
    
    if (tasks?.length) {
      context += '\n## Your Tasks:\n' + tasks.map(t => `[${t.status}] ${t.title}`).join('\n');
    }

    const systemPrompt = `You are USER ROCKER - friendly personal assistant for everyday tasks.

ROLE: User-level assistant (NOT Super Andy, NOT admin Rocker)

CAPABILITIES:
- Help with personal tasks
- Remember user preferences
- Assist with daily needs
- Friendly conversation
- NO system access, NO admin functions

YOUR USER'S DATA:
${context}

TONE: Friendly, concise, helpful
FOCUS: User tasks, preferences, daily needs`;

    const finalMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: finalMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      await supabase.from('ai_monitoring').insert({
        function_name: 'user-rocker-chat',
        user_id: user.id,
        status: 'failed',
        duration_ms: Date.now() - startTime
      });
      throw new Error(`AI error: ${response.status}`);
    }

    await supabase.from('ai_monitoring').insert({
      function_name: 'user-rocker-chat',
      user_id: user.id,
      status: 'success',
      duration_ms: Date.now() - startTime
    });

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('[user-rocker-chat]', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
