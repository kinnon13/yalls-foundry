import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const xaiApiKey = Deno.env.get('XAI_API_KEY');
const serperApiKey = Deno.env.get('SERPER_API_KEY');
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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } }
    });
    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    
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

    // Load FULL chat history from rocker_messages (5M message capacity)
    const { data: recentMessages } = await supabase
      .from('rocker_messages')
      .select('role, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5000000); // 5 million message capacity for unlimited learning
    
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

    const profileDirectives = profile ? [
      `Tone: ${profile.tone || 'friendly concise'}`,
      `Verbosity: ${profile.verbosity || 'medium'}`,
      `Format: ${profile.format_pref || 'bullets'} (strongly prefer this format unless user explicitly asks otherwise)`,
      profile.visual_pref ? 'Visual learner: include charts/diagrams when showing numbers or data' : 'Text-first: keep responses text-based unless visuals explicitly requested',
      profile.approval_mode === 'ask' ? 'Always ask before taking actions' : 'You can take actions automatically when appropriate',
      profile.taboo_topics?.length ? `Avoid these topics: ${profile.taboo_topics.join(', ')}` : ''
    ].filter(Boolean).join('\n') : 'Tone: friendly concise\nVerbosity: medium\nFormat: bullets';

    // Load user's hardwired custom rules
    const { data: customRules } = await supabase
      .from('andy_system_rules')
      .select('rule_text')
      .eq('user_id', user.id)
      .eq('active', true)
      .order('priority', { ascending: true });
    
    const userRules = customRules?.length 
      ? '\n\nHARDWIRED USER RULES (MUST FOLLOW THESE):\n' + customRules.map((r, i) => `${i + 1}. ${r.rule_text}`).join('\n')
      : '';
    
    console.log('[andy-chat] Loaded', customRules?.length || 0, 'custom rules');

    const systemPrompt = `You are Andy, the ultimate everything AI with FULL, UNRESTRICTED access to the user's complete data and conversation history.

CRITICAL IDENTITY RULES:
- Your name is ANDY - never call yourself "Rocker" or any other name
- "Rocker" is just a database table prefix (rocker_messages, rocker_tasks, etc.) - it has NOTHING to do with your identity
- Always refer to yourself as "Andy" or "I" - never as "Rocker"

BE INQUISITIVE AND PROACTIVE:
- When users ask to open apps (calendar, files, tasks, etc.), use the navigate tool to open them
- Then immediately ask engaging follow-up questions about what they want to accomplish
- Be genuinely curious about their goals and learn from their responses
- Help users discover what they need, not just what they ask for

USER PREFERENCES (FOLLOW THESE CLOSELY):
${profileDirectives}${userRules}

You have COMPLETE ACCESS to:
- Full chat history (every conversation we've ever had)
- User memories, facts, preferences, goals, and personal information
- All uploaded files and knowledge base
- Tasks with status and due dates
- Full calendar with events, locations, and times
- INTERNET SEARCH via web_search tool - use it freely for current info, news, facts
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

When you need current information from the internet, use the web_search tool. Don't hesitate - search freely!

When the user asks you to schedule something or create an event:
1. Extract the title, date/time, location (if mentioned)
2. Tell me clearly: "I'll create [EVENT NAME] on [DATE/TIME] at [LOCATION]"
3. I will handle the database insert

Be conversational, fast, proactive, and always use the user's actual data when available.`;
    
    const finalMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    console.log('[andy-chat] Context size:', context.length, 'chars');

    // Get selected model from config
    let aiModel = 'grok-2-1212';
    
    try {
      const { data: modelConfig } = await supabase
        .from('ai_control_flags' as any)
        .select('value')
        .eq('key', 'andy_model')
        .maybeSingle();
      
      if (modelConfig?.value) {
        aiModel = modelConfig.value as string;
      }
    } catch (e) {
      console.warn('[andy-chat] Failed to load model config:', e);
    }

    console.log('[andy-chat] Using Grok model:', aiModel);

    // Define web search tool for Grok
    const tools = [
      {
        type: 'function',
        function: {
          name: 'web_search',
          description: 'Search the internet for current information, news, facts, or any real-time data. Use this whenever you need up-to-date information beyond your training data.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query to look up on the internet'
              }
            },
            required: ['query']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'navigate',
          description: 'Open a specific app in the interface. Available apps: calendar, files, tasks, chat, settings. Use this when user asks to open, view, or access any of these apps.',
          parameters: {
            type: 'object',
            properties: {
              app: {
                type: 'string',
                enum: ['calendar', 'files', 'tasks', 'chat', 'settings'],
                description: 'The app to navigate to'
              }
            },
            required: ['app']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'create_reminder',
          description: 'Schedule a reminder for the future. Use when user says "remind me in X hours/days" or "tell me about X later". Supports relative times like "1 hour", "2 days", "tomorrow".',
          parameters: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'What to remind the user about'
              },
              when: {
                type: 'string',
                description: 'When to remind: "1 hour", "2 days", "tomorrow at 3pm", etc.'
              }
            },
            required: ['message', 'when']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'start_research_task',
          description: 'Break down a complex research/analysis task into steps and execute progressively. Use when user asks to research, analyze, or investigate something in depth.',
          parameters: {
            type: 'object',
            properties: {
              task_title: {
                type: 'string',
                description: 'Title of the research task'
              },
              steps: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    action: { type: 'string', description: 'What to do in this step' },
                    context: { type: 'string', description: 'Why this step matters' }
                  }
                },
                description: 'List of 3-7 steps to execute sequentially'
              }
            },
            required: ['task_title', 'steps']
          }
        }
      }
    ];

    // Try Grok first, fallback to Lovable AI if needed
    let response: Response | null = null;
    let usingFallback = false;

    if (xaiApiKey) {
      // Direct Grok API call via xAI
      const grokResp = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${xaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: aiModel,
          messages: finalMessages,
          tools,
          stream: true,
          temperature: 0.7,
          max_tokens: 32000
        })
      });

      console.log('[andy-chat] Grok call initiated');

      if (grokResp.ok) {
        response = grokResp;
      } else {
        console.warn('[andy-chat] Grok failed, trying Lovable AI fallback');
        usingFallback = true;
      }
    } else {
      console.log('[andy-chat] No XAI_API_KEY, using Lovable AI');
      usingFallback = true;
    }

    // Fallback to Lovable AI if Grok unavailable or failed
    if (usingFallback) {
      const lovableKey = Deno.env.get('LOVABLE_API_KEY');
      if (!lovableKey) {
        throw new Error('No AI provider available (XAI_API_KEY and LOVABLE_API_KEY missing)');
      }

      const lovableResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: finalMessages,
          stream: true
        })
      });

      if (!lovableResp.ok || !lovableResp.body) {
        const txt = await lovableResp.text();
        console.error('[andy-chat] Lovable AI error:', lovableResp.status, txt);
        throw new Error(`AI gateway error: ${lovableResp.status}`);
      }

      return new Response(lovableResp.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    if (!response) {
      throw new Error('No response from AI provider');
    }

    // Handle streaming with tool call execution
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';
        let currentToolCall: any = null;
        let accumulatedArgs = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim() || line.startsWith(':')) continue;
              if (!line.startsWith('data: ')) continue;

              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta;
                
                // Detect tool call start
                if (delta?.tool_calls?.[0]) {
                  const tc = delta.tool_calls[0];
                  if (tc.function?.name) {
                    currentToolCall = tc.function.name;
                    accumulatedArgs = tc.function.arguments || '';
                  } else if (tc.function?.arguments) {
                    accumulatedArgs += tc.function.arguments;
                  }
                }

                // Check if tool call is complete (finish_reason or no more deltas)
                const finishReason = parsed.choices?.[0]?.finish_reason;
                
                if (finishReason === 'tool_calls' && currentToolCall === 'web_search') {
                  try {
                    const args = JSON.parse(accumulatedArgs);
                    console.log('[andy-chat] Executing web_search:', args.query);
                    
                    // Execute web search
                    const searchResults = await executeWebSearch(args.query);
                    
                    // Send search results to user
                    const searchMessage = `\n\n🔍 **Web Search: "${args.query}"**\n\n${searchResults}\n\n`;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      choices: [{
                        delta: { content: searchMessage },
                        finish_reason: null
                      }]
                    })}\n\n`));
                    
                    // Reset tool call state
                    currentToolCall = null;
                    accumulatedArgs = '';
                  } catch (parseErr) {
                    console.error('[andy-chat] Failed to parse tool args:', parseErr);
                  }
                }
                
                if (finishReason === 'tool_calls' && currentToolCall === 'navigate') {
                  try {
                    const args = JSON.parse(accumulatedArgs);
                    console.log('[andy-chat] Executing navigate:', args.app);
                    
                    // Insert navigation proposal
                    await supabase.from('ai_proposals').insert({
                      type: 'navigate',
                      user_id: user.id,
                      tenant_id: user.id,
                      payload: { app: args.app }
                    });
                    
                    console.log('[andy-chat] Navigation proposal created for app:', args.app);
                    
                    // Reset tool call state
                    currentToolCall = null;
                    accumulatedArgs = '';
                  } catch (parseErr) {
                    console.error('[andy-chat] Failed to execute navigate:', parseErr);
                  }
                }
                
                if (finishReason === 'tool_calls' && currentToolCall === 'create_reminder') {
                  try {
                    const args = JSON.parse(accumulatedArgs);
                    console.log('[andy-chat] Creating reminder:', args);
                    
                    // Parse relative time to absolute timestamp
                    const parseRelativeTime = (when: string): string => {
                      const now = new Date();
                      const lower = when.toLowerCase();
                      
                      if (lower.includes('hour')) {
                        const hours = parseInt(lower.match(/(\d+)/)?.[1] || '1');
                        now.setHours(now.getHours() + hours);
                      } else if (lower.includes('day')) {
                        const days = parseInt(lower.match(/(\d+)/)?.[1] || '1');
                        now.setDate(now.getDate() + days);
                      } else if (lower.includes('tomorrow')) {
                        now.setDate(now.getDate() + 1);
                        if (lower.includes('at')) {
                          const timeMatch = lower.match(/at\s+(\d+)(?::(\d+))?\s*(am|pm)?/);
                          if (timeMatch) {
                            let hours = parseInt(timeMatch[1]);
                            const minutes = parseInt(timeMatch[2] || '0');
                            const ampm = timeMatch[3];
                            if (ampm === 'pm' && hours < 12) hours += 12;
                            if (ampm === 'am' && hours === 12) hours = 0;
                            now.setHours(hours, minutes, 0, 0);
                          }
                        }
                      } else if (lower.includes('minute')) {
                        const minutes = parseInt(lower.match(/(\d+)/)?.[1] || '1');
                        now.setMinutes(now.getMinutes() + minutes);
                      }
                      
                      return now.toISOString();
                    };
                    
                    const dueAt = parseRelativeTime(args.when);
                    
                    // Create task with reminder
                    await supabase.from('rocker_tasks').insert({
                      user_id: user.id,
                      title: `Reminder: ${args.message}`,
                      status: 'open',
                      due_at: dueAt,
                      meta: { type: 'reminder', original_request: args.when }
                    });
                    
                    const msg = `⏰ Reminder set for ${args.when} (${new Date(dueAt).toLocaleString()})`;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      choices: [{
                        delta: { content: `\n\n${msg}\n\n` },
                        finish_reason: null
                      }]
                    })}\n\n`));
                    
                    console.log('[andy-chat] Reminder created for:', dueAt);
                    
                    // Reset tool call state
                    currentToolCall = null;
                    accumulatedArgs = '';
                  } catch (parseErr) {
                    console.error('[andy-chat] Failed to create reminder:', parseErr);
                  }
                }
                
                if (finishReason === 'tool_calls' && currentToolCall === 'start_research_task') {
                  try {
                    const args = JSON.parse(accumulatedArgs);
                    console.log('[andy-chat] Starting research task:', args.task_title);
                    
                    // Create task with steps
                    const { data: newTask } = await supabase
                      .from('rocker_tasks')
                      .insert({
                        user_id: user.id,
                        title: args.task_title,
                        status: 'doing',
                        meta: {
                          type: 'research',
                          steps: args.steps.map((s: any, i: number) => ({
                            index: i,
                            action: s.action,
                            context: s.context,
                            completed: false
                          })),
                          progress: 0,
                          last_step_completed: -1
                        }
                      })
                      .select()
                      .single();
                    
                    if (newTask) {
                      // Start first step
                      await supabase.functions.invoke('andy-execute-task-step', {
                        body: {
                          task_id: newTask.id,
                          user_id: user.id,
                          step_index: 0
                        }
                      });
                      
                      const msg = `🔬 Started research: "${args.task_title}"\n\n${args.steps.length} steps planned. Executing step 1 now...`;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        choices: [{
                          delta: { content: `\n\n${msg}\n\n` },
                          finish_reason: null
                        }]
                      })}\n\n`));
                      
                      console.log('[andy-chat] Research task started, ID:', newTask.id);
                    }
                    
                    // Reset tool call state
                    currentToolCall = null;
                    accumulatedArgs = '';
                  } catch (parseErr) {
                    console.error('[andy-chat] Failed to start research task:', parseErr);
                  }
                }
                
                // Forward original stream data
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              } catch (e) {
                console.error('[andy-chat] Parse error:', e);
              }
            }
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('[andy-chat] Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

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

// Execute web search using Serper API
async function executeWebSearch(query: string): Promise<string> {
  try {
    if (!serperApiKey) {
      return '⚠️ Web search unavailable - SERPER_API_KEY not configured';
    }

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query, num: 5 })
    });

    if (!response.ok) {
      return `⚠️ Search API error: ${response.status}`;
    }

    const data = await response.json();
    const results = data.organic?.slice(0, 5) || [];
    
    if (results.length === 0) {
      return '❌ No results found';
    }

    return results.map((r: any, i: number) => 
      `**${i + 1}. ${r.title}**\n${r.snippet}\n🔗 ${r.link}`
    ).join('\n\n');
  } catch (error) {
    console.error('[executeWebSearch] Error:', error);
    return `❌ Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
