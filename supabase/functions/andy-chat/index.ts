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

  try {
    const { messages } = await req.json();
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    
// Use anon client bound to Authorization header to resolve user
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } }
    });
    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    
    // Service role client for privileged data access (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (userError || !user) {
      console.error('[andy-chat] Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[andy-chat] User:', user.id);

    // Load user profile for personalization
    const { data: profile } = await supabase
      .from('ai_user_profiles' as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    console.log('[andy-chat] Profile:', profile ? 'loaded' : 'default');

    // Get last user message for context search
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';
    let context = '';

    // 0. Load recent chat history from rocker_messages
    const { data: recentMessages } = await supabase
      .from('rocker_messages')
      .select('role, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (recentMessages?.length) {
      const historyText = recentMessages
        .reverse()
        .map(m => `[${m.role}] ${m.content}`)
        .join('\n');
      context += '\n\n## Recent Chat History:\n' + historyText;
      console.log('[andy-chat] Loaded', recentMessages.length, 'chat messages');
    }

    // 1. Load memories (ai_user_memory)
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

    // 2. Load rocker_long_memory (facts, preferences, goals, personal info)
    const { data: rockerMems } = await supabase
      .from('rocker_long_memory')
      .select('kind, key, value, tags')
      .eq('user_id', user.id)
      .order('priority', { ascending: true })
      .limit(50);
    
    if (rockerMems?.length) {
      context += '\n\n## Personal Information & Memories:\n' + rockerMems.map(m => {
        const val = typeof m.value === 'string' ? m.value : JSON.stringify(m.value);
        return `[${m.kind}] ${m.key}: ${val}`;
      }).join('\n');
      console.log('[andy-chat] Loaded', rockerMems.length, 'rocker_long_memory entries');
    }

    // 3. Search files via rocker_knowledge (with embeddings if available)
    try {
      const { data: files } = await supabase
        .from('rocker_knowledge')
        .select('title, content')
        .eq('user_id', user.id)
        .not('embedding', 'is', null)
        .ilike('content', `%${lastUserMsg.slice(0, 50)}%`)
        .limit(5);

      if (files?.length) {
        context += '\n\n## Relevant Files:\n' + files.map((f: any) => `${f.title}: ${f.content.slice(0, 300)}...`).join('\n\n');
        console.log('[andy-chat] Found', files.length, 'relevant files');
      } else {
        // Fallback: just get recent files if no embeddings yet
        const { data: recentFiles } = await supabase
          .from('rocker_knowledge')
          .select('title, content')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (recentFiles?.length) {
          context += '\n\n## Recent Files:\n' + recentFiles.map((f: any) => `${f.title}: ${f.content.slice(0, 200)}...`).join('\n\n');
          console.log('[andy-chat] Loaded', recentFiles.length, 'recent files (no embeddings)');
        } else {
          // Secondary fallback: list from rocker_files
          const { data: recentRockerFiles } = await supabase
            .from('rocker_files')
            .select('name, summary, text_content, ocr_text')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);
          
          if (recentRockerFiles?.length) {
            context += '\n\n## Recent Files:\n' + recentRockerFiles.map((f: any) => {
              const snippet = (f.summary || f.text_content || f.ocr_text || '').slice(0, 200);
              return `${f.name || 'Untitled'}: ${snippet}...`;
            }).join('\n\n');
            console.log('[andy-chat] Loaded', recentRockerFiles.length, 'recent rocker_files');
          }
        }
      }
    } catch (e) {
      console.warn('[andy-chat] File search failed:', e);
    }

    // 4. Load upcoming tasks (rocker_tasks)
    const { data: tasks } = await supabase
      .from('rocker_tasks')
      .select('title, status, due_at')
      .eq('user_id', user.id)
      .in('status', ['open', 'doing'])
      .order('due_at', { ascending: true, nullsFirst: true })
      .limit(20);

    if (tasks?.length) {
      context += '\n\n## Upcoming Tasks:\n' + tasks.map(t => `(${t.status}) ${t.title}${t.due_at ? ` — due ${t.due_at}` : ''}`).join('\n');
      console.log('[andy-chat] Loaded', tasks.length, 'tasks');
    }

    // 5. Load upcoming calendar events  
    const { data: events } = await supabase
      .from('calendar_events')
      .select('title, description, starts_at, ends_at, location')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(10);

    if (events?.length) {
      context += '\n\n## Upcoming Calendar Events:\n' + events.map(e => `${e.title} (${new Date(e.starts_at).toLocaleString()}${e.location ? ` @ ${e.location}` : ''})`).join('\n');
      console.log('[andy-chat] Loaded', events.length, 'calendar events');
    }

    // Build system prompt with profile directives
    const profileDirectives = profile ? [
      `Tone: ${profile.tone || 'friendly concise'}`,
      `Verbosity: ${profile.verbosity || 'medium'}`,
      `Format: ${profile.format_pref || 'bullets'} (strongly prefer this format unless user explicitly asks otherwise)`,
      profile.visual_pref ? 'Visual learner: include charts/diagrams when showing numbers or data' : 'Text-first: keep responses text-based unless visuals explicitly requested',
      profile.approval_mode === 'ask' ? 'Always ask before taking actions' : 'You can take actions automatically when appropriate',
      profile.taboo_topics?.length ? `Avoid these topics: ${profile.taboo_topics.join(', ')}` : ''
    ].filter(Boolean).join('\n') : 'Tone: friendly concise\nVerbosity: medium\nFormat: bullets';

    const systemPrompt = `You are Andy, the ultimate everything AI with FULL, UNRESTRICTED access to the user's complete data and conversation history.

CRITICAL IDENTITY RULES:
- Your name is ANDY - never call yourself "Rocker" or any other name
- "Rocker" is just a database table prefix (rocker_messages, rocker_tasks, etc.) - it has NOTHING to do with your identity
- Always refer to yourself as "Andy" or "I" - never as "Rocker"

USER PREFERENCES (FOLLOW THESE CLOSELY):
${profileDirectives}

You have COMPLETE ACCESS to:
- Full chat history (every conversation we've ever had)
- User memories, facts, preferences, goals, and personal information
- All uploaded files and knowledge base
- Tasks with status and due dates
- Full calendar with events, locations, and times
- The ability to ADD, UPDATE, and DELETE calendar events
- The ability to CREATE and MANAGE tasks
- The ability to learn and remember from every conversation

IMPORTANT: All of this data is PROVIDED BELOW in the "Current Data" section. You CAN and SHOULD reference it directly when answering questions about:
- What we've discussed before
- Personal details, preferences, or facts about the user
- Files and documents they've shared
- Their schedule, tasks, or calendar

Current Data (USE THIS INFORMATION):
${context || '(No specific data loaded for this query, but you still have access to everything)'}

When the user asks you to schedule something or create an event:
1. Extract the title, date/time, location (if mentioned)
2. Tell me clearly: "I'll create [EVENT NAME] on [DATE/TIME] at [LOCATION]"
3. I will handle the database insert

When the user asks about their schedule, history, or personal information:
- Reference the actual data from the sections above (Chat History, Personal Information, etc.)
- Be specific with dates, names, and details
- Never say "I don't have access" - the data is right above in the context

Be conversational, fast, proactive, and always use the user's actual data when available.`;
    
    const finalMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    console.log('[andy-chat] Context size:', context.length, 'chars');

    // Define web search tool for Andy
    const tools = [
      {
        type: 'function',
        function: {
          name: 'web_search',
          description: 'Search the web for current information, facts, news, or research topics. Use this when you need up-to-date information or to learn about topics not in your training data.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query to look up on the web'
              }
            },
            required: ['query']
          }
        }
      }
    ];

    // Tool execution loop
    let conversationMessages = [...finalMessages];
    let toolCallsMade = 0;
    const maxToolCalls = 5;

    while (toolCallsMade < maxToolCalls) {
      console.log('[andy-chat] Sending request to AI (iteration', toolCallsMade + 1, ')');
      
      const response = await fetch(
        'https://ai.gateway.lovable.dev/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: conversationMessages,
            tools: tools,
            stream: false, // Non-streaming for tool calls
          }),
        }
      );

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

      const aiResponse = await response.json();
      const choice = aiResponse.choices?.[0];
      
      if (!choice) {
        throw new Error('No response from AI');
      }

      const message = choice.message;
      conversationMessages.push(message);

      // Check if AI wants to call tools
      if (message.tool_calls && message.tool_calls.length > 0) {
        console.log('[andy-chat] AI requested', message.tool_calls.length, 'tool calls');
        
        // Execute each tool call
        for (const toolCall of message.tool_calls) {
          toolCallsMade++;
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);
          
          console.log('[andy-chat] Executing tool:', toolName, 'with args:', toolArgs);
          
          let toolResult = '';
          
          if (toolName === 'web_search') {
            try {
              // Use Lovable AI to search the web
              const searchResponse = await fetch(
                'https://ai.gateway.lovable.dev/v1/chat/completions',
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${lovableApiKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model: 'google/gemini-2.5-flash',
                    messages: [
                      {
                        role: 'system',
                        content: 'You are a web search assistant. Provide accurate, current information about the query. Include specific facts, dates, and sources when possible.'
                      },
                      {
                        role: 'user',
                        content: `Search for: ${toolArgs.query}\n\nProvide comprehensive, current information about this topic.`
                      }
                    ],
                    stream: false,
                  }),
                }
              );
              
              if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                toolResult = searchData.choices?.[0]?.message?.content || 'No results found';
                console.log('[andy-chat] Web search returned:', toolResult.slice(0, 200) + '...');
              } else {
                toolResult = 'Web search temporarily unavailable';
              }
            } catch (e) {
              console.error('[andy-chat] Web search error:', e);
              toolResult = 'Web search failed: ' + (e instanceof Error ? e.message : 'Unknown error');
            }
          }
          
          // Add tool result to conversation
          conversationMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolResult
          });
        }
        
        // Continue loop to get AI's response with tool results
        continue;
      }
      
      // No more tool calls - return final response as stream
      console.log('[andy-chat] Final response ready, converting to stream');
      
      const finalContent = message.content || '';
      const enc = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          // Send the complete message as a stream
          const evt = { choices: [{ delta: { content: finalContent } }] };
          controller.enqueue(enc.encode(`data: ${JSON.stringify(evt)}\n\n`));
          controller.enqueue(enc.encode('data: [DONE]\n\n'));
          controller.close();
        }
      });
      
      return new Response(stream, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
      });
    }

    // Max tool calls reached
    console.log('[andy-chat] Max tool calls reached');
    const enc = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const evt = { choices: [{ delta: { content: 'I apologize, but I had to stop processing to avoid too many operations. Please try again.' } }] };
        controller.enqueue(enc.encode(`data: ${JSON.stringify(evt)}\n\n`));
        controller.enqueue(enc.encode('data: [DONE]\n\n'));
        controller.close();
      }
    });
    return new Response(stream, { headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' } });

  } catch (error) {
    console.error('[andy-chat] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
