import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader || '' } }
    });
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[andy-chat] Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[andy-chat] User:', user.id);

    // Get last user message for context search
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';
    let context = '';

    // 1. Load memories
    const { data: memories } = await supabase
      .from('ai_user_memory')
      .select('memory_type, content, score')
      .eq('user_id', user.id)
      .order('score', { ascending: false })
      .limit(10);
    
    if (memories?.length) {
      context += '\n\n## Your Memories:\n' + memories.map(m => `[${m.memory_type}] ${m.content}`).join('\n');
      console.log('[andy-chat] Loaded', memories.length, 'memories');
    }

    // 2. Search files via rocker_knowledge
    try {
      const { data: files } = await supabase
        .from('rocker_knowledge')
        .select('title, content')
        .eq('user_id', user.id)
        .ilike('content', `%${lastUserMsg.slice(0, 50)}%`)
        .limit(5);

      if (files?.length) {
        context += '\n\n## Relevant Files:\n' + files.map((f: any) => `${f.title}: ${f.content.slice(0, 200)}...`).join('\n\n');
        console.log('[andy-chat] Found', files.length, 'relevant files');
      }
    } catch (e) {
      console.warn('[andy-chat] File search failed:', e);
    }

    // 3. Load upcoming tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, description, due_date, priority')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(10);

    if (tasks?.length) {
      context += '\n\n## Upcoming Tasks:\n' + tasks.map(t => `[${t.priority}] ${t.title} (due: ${t.due_date || 'no date'})`).join('\n');
      console.log('[andy-chat] Loaded', tasks.length, 'tasks');
    }

    // 4. Load upcoming calendar events
    const { data: events } = await supabase
      .from('calendar_events')
      .select('title, description, start_time, end_time')
      .eq('user_id', user.id)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(10);

    if (events?.length) {
      context += '\n\n## Upcoming Events:\n' + events.map(e => `${e.title} (${e.start_time} - ${e.end_time})`).join('\n');
      console.log('[andy-chat] Loaded', events.length, 'events');
    }

    const systemPrompt = `You are Andy, an all-knowing AI assistant with full access to the user's data.

You have access to:
- User memories and preferences
- All uploaded files and documents  
- Tasks and calendar events
- The ability to learn from conversations

Current Context:
${context || '(No context loaded yet - encourage user to upload files or add tasks)'}

Be conversational, helpful, and proactive. Reference the user's actual data when relevant.`;
    
    const finalMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    console.log('[andy-chat] Calling Lovable AI with context length:', context.length);

    // Call Lovable AI for streaming response
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: finalMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[andy-chat] AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Return the stream directly
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('[andy-chat] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
