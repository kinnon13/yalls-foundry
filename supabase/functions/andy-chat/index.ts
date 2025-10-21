import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { ai } from "../_shared/ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Andy Chat - Your Everything AI
 * Full learning, file access, tasks, calendar, proactive suggestions
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages, extract_insights = true } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';

    // 1) Load context: memories, files, tasks, calendar
    let context = '';

    // Load recent memories
    const { data: memories } = await supabase
      .from('ai_user_memory')
      .select('memory_type, content, score')
      .eq('user_id', user.id)
      .order('score', { ascending: false })
      .limit(10);
    
    if (memories?.length) {
      context += '\n\n## Your Memories:\n' + memories.map(m => `[${m.memory_type}] ${m.content}`).join('\n');
    }

    // Load relevant files via embedding search
    try {
      const vectors = await ai.embed('knower', [lastUserMsg]);
      const queryEmbedding = vectors[0];
      
      const { data: files } = await supabase.rpc('match_kb_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.6,
        match_count: 5,
      });

      if (files?.length) {
        context += '\n\n## Relevant Files:\n' + files.map((f: any) => `${f.title}: ${f.content}`).join('\n\n');
      }
    } catch (e) {
      console.warn('[andy-chat] File search failed:', e);
    }

    // Load upcoming tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, description, due_date, priority')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(10);

    if (tasks?.length) {
      context += '\n\n## Upcoming Tasks:\n' + tasks.map(t => `[${t.priority}] ${t.title} (due: ${t.due_date || 'no date'})`).join('\n');
    }

    // Load upcoming calendar events
    const { data: events } = await supabase
      .from('calendar_events')
      .select('title, description, start_time, end_time')
      .eq('user_id', user.id)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(10);

    if (events?.length) {
      context += '\n\n## Upcoming Events:\n' + events.map(e => `${e.title} (${e.start_time} - ${e.end_time})`).join('\n');
    }

    // 2) Build system prompt
    const systemPrompt = `You are Andy, the ultimate Everything AI. You are proactive, intelligent, and deeply integrated with the user's life.

You have access to:
- User memories and preferences
- All uploaded files and documents
- Tasks and calendar events
- Web search capabilities (via SERPAPI)

Your capabilities:
- Create/update tasks
- Schedule calendar events
- Extract insights and learnings
- Search the web for information
- Organize and tag information
- Proactive suggestions

Always be helpful, concise, and actionable. When you learn something new about the user, note it explicitly.

${context}`;

    // 3) Call AI with tools
    const tools = [
      {
        name: 'create_task',
        description: 'Create a new task for the user',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            due_date: { type: 'string' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] }
          },
          required: ['title']
        }
      },
      {
        name: 'create_event',
        description: 'Schedule a calendar event',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            start_time: { type: 'string' },
            end_time: { type: 'string' }
          },
          required: ['title', 'start_time']
        }
      },
      {
        name: 'web_search',
        description: 'Search the web for information',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string' }
          },
          required: ['query']
        }
      },
      {
        name: 'save_memory',
        description: 'Store an important fact or preference',
        parameters: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            memory_type: { type: 'string', enum: ['preference', 'fact', 'goal', 'interaction'] }
          },
          required: ['content', 'memory_type']
        }
      }
    ];

    const { text, raw } = await ai.chat({
      role: 'knower',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      tools,
      maxTokens: 2000,
      temperature: 0.7
    });

    // 4) Execute any tool calls
    const toolCalls = raw?.choices?.[0]?.message?.tool_calls || [];
    const toolResults: any[] = [];

    for (const call of toolCalls) {
      const funcName = call.function.name;
      const args = JSON.parse(call.function.arguments || '{}');

      try {
        if (funcName === 'create_task') {
          const { error } = await supabase.from('tasks').insert({
            user_id: user.id,
            title: args.title,
            description: args.description,
            due_date: args.due_date,
            priority: args.priority || 'medium',
            completed: false
          });
          toolResults.push({ tool: 'create_task', success: !error, data: args });
        } else if (funcName === 'create_event') {
          const { error } = await supabase.from('calendar_events').insert({
            user_id: user.id,
            title: args.title,
            description: args.description,
            start_time: args.start_time,
            end_time: args.end_time || args.start_time
          });
          toolResults.push({ tool: 'create_event', success: !error, data: args });
        } else if (funcName === 'web_search') {
          const { data: searchData } = await supabase.functions.invoke('rocker-web-search', {
            body: { query: args.query, num_results: 5 }
          });
          toolResults.push({ tool: 'web_search', success: true, data: searchData });
        } else if (funcName === 'save_memory') {
          const vectors = await ai.embed('knower', [args.content]);
          const { error } = await supabase.from('ai_user_memory').insert({
            user_id: user.id,
            memory_type: args.memory_type,
            content: args.content,
            embedding: vectors[0],
            score: 1.0
          });
          toolResults.push({ tool: 'save_memory', success: !error, data: args });
        }
      } catch (toolError) {
        console.error(`[andy-chat] Tool ${funcName} failed:`, toolError);
        toolResults.push({ tool: funcName, success: false, error: String(toolError) });
      }
    }

    // 5) Store conversation and extract insights
    if (extract_insights) {
      try {
        await supabase.from('rocker_messages').insert([
          { user_id: user.id, role: 'user', content: lastUserMsg, actor_role: 'knower' },
          { user_id: user.id, role: 'assistant', content: text, actor_role: 'knower', metadata: { tool_results: toolResults } }
        ]);

        // Background: extract insights
        supabase.functions.invoke('rocker-insights', {
          body: { 
            conversation: `User: ${lastUserMsg}\nAndy: ${text}`,
            extract_memories: true,
            user_id: user.id
          }
        }).catch(e => console.warn('[andy-chat] Insight extraction failed:', e));
      } catch (e) {
        console.warn('[andy-chat] Message storage failed:', e);
      }
    }

    return new Response(JSON.stringify({
      response: text,
      tool_results: toolResults,
      learning: 'enabled',
      capabilities: ['tasks', 'calendar', 'files', 'memories', 'web_search']
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[andy-chat] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});