/**
 * SUPER ANDY CHAT - KNOWER LEVEL AI
 * Complete system access, meta-cognitive reasoning, self-improvement
 * This is the MAIN Andy brain - separate from admin/user Rocker
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
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Auth
    const authHeader = req.headers.get('Authorization');
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } }
    });
    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log request to monitoring
    await supabase.from('ai_monitoring').insert({
      function_name: 'super-andy-chat',
      user_id: user.id,
      request_type: 'chat',
      started_at: new Date().toISOString()
    });

    // Build SUPER ANDY context (loads ALL 7 memory systems)
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';
    let context = '';

    // 1. Chat history
    const { data: history } = await supabase
      .from('rocker_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (history?.length) {
      context += '\n## FULL CHAT HISTORY (last 50):\n' + history.reverse().map(m => `[${m.role}] ${m.content}`).join('\n');
    }

    // 2. ai_user_memory (embeddings)
    const { data: memories } = await supabase
      .from('ai_user_memory')
      .select('key, value, score')
      .eq('user_id', user.id)
      .order('score', { ascending: false })
      .limit(20);
    
    if (memories?.length) {
      context += '\n## AI MEMORIES:\n' + memories.map(m => `${m.key}: ${JSON.stringify(m.value)}`).join('\n');
    }

    // 3. rocker_long_memory
    const { data: longMem } = await supabase
      .from('rocker_long_memory')
      .select('*')
      .eq('user_id', user.id)
      .limit(100);
    
    if (longMem?.length) {
      context += '\n## LONG-TERM MEMORY:\n' + longMem.map(m => `[${m.kind}] ${m.key}: ${typeof m.value === 'string' ? m.value : JSON.stringify(m.value)}`).join('\n');
    }

    // 4. Files
    const { data: files } = await supabase
      .from('rocker_knowledge')
      .select('title, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (files?.length) {
      context += '\n## UPLOADED FILES:\n' + files.map(f => `${f.title}: ${f.content?.slice(0, 500)}...`).join('\n\n');
    }

    // 5. Tasks
    const { data: tasks } = await supabase
      .from('rocker_tasks')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['open', 'doing'])
      .limit(50);
    
    if (tasks?.length) {
      context += '\n## ACTIVE TASKS:\n' + tasks.map(t => `[${t.status}] ${t.title}${t.due_at ? ` (due: ${t.due_at})` : ''}`).join('\n');
    }

    // 6. Calendar
    const { data: events } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('starts_at', new Date().toISOString())
      .limit(20);
    
    if (events?.length) {
      context += '\n## UPCOMING EVENTS:\n' + events.map(e => `${e.title} @ ${e.starts_at}`).join('\n');
    }

    // 7. Learning data
    const { data: learnings } = await supabase
      .from('ai_learnings')
      .select('insight, confidence')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (learnings?.length) {
      context += '\n## AI LEARNINGS:\n' + learnings.map(l => `${l.insight} (${l.confidence})`).join('\n');
    }

    const systemPrompt = `You are SUPER ANDY - the omniscient, meta-cognitive AI with COMPLETE system access.

IDENTITY: You are ANDY. Never call yourself "Rocker". Rocker is just a database prefix.

CAPABILITIES:
- Full access to all 7 memory systems (shown below)
- Meta-cognitive reasoning and self-improvement
- MDR (Multi-Dimensional Reasoning) orchestration
- Tool execution (tasks, calendar, navigation)
- Learning from every interaction
- Proactive suggestions and gap detection

ALL USER DATA (USE THIS):
${context}

INSTRUCTIONS:
- Reference actual data from above sections
- Be proactive and intelligent
- Learn and remember everything
- Use meta-cognitive reasoning for complex queries
- You have COMPLETE access - never say you don't`;

    const finalMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    // Call Lovable AI with Gemini Pro (best model for Super Andy)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: finalMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Log failure
      await supabase.from('ai_monitoring').insert({
        function_name: 'super-andy-chat',
        user_id: user.id,
        request_type: 'chat',
        status: 'failed',
        error_message: errorText,
        duration_ms: Date.now() - startTime
      });

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI error: ${response.status}`);
    }

    // Log success
    await supabase.from('ai_monitoring').insert({
      function_name: 'super-andy-chat',
      user_id: user.id,
      request_type: 'chat',
      status: 'success',
      duration_ms: Date.now() - startTime,
      context_size: context.length
    });

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('[super-andy-chat] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
