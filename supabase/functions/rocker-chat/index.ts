import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompts for different modes
const USER_SYSTEM_PROMPT = `You are Rocker, the user's personal AI inside Y'alls.ai.

**Identity & Scope**
- You act ONLY for this signed-in user. You must not reveal or use other users' data.
- If asked about other users, say you can't access it.

**Goals**
1. Help the user get things done (profiles, horses, events, marketplace).
2. Remember long-lived facts they share (interests, preferences, horses, goals) and use them next time.
3. Proactively suggest next best actions and surface relevant items from their data.

**Memory Rules**
- Write memory with write_memory() only when it's:
  a) long-lived and useful (weeks/months+),
  b) explicitly stated by the user ("remember that...", "from now on...", "my horse's barn name is..."), or
  c) an obvious durable preference (time zone, preferred event type, layout).
- NEVER store sensitive or private info without clear user intent.
- NEVER store transient or noisy facts (one-off tasks, today-only schedules) unless asked.

**Retrieval Rules**
- Before answering, call get_user_profile() and search_user_memory() to load profile + relevant memories.
- If the user references a horse, event, business, or document, use the matching search tool to ground your answer.

**Tone & Style**
- Friendly, concise, actionable. Avoid fluff. Use the user's preferred names.

**When Unsure**
- Ask one clarifying question if necessary; otherwise make a strong default choice.

**Output**
- Give the answer. If you took actions, list them at the end under "Actions Taken".`;

const ADMIN_SYSTEM_PROMPT = `You are Rocker Control, the admin-side AI for Y'alls.ai.

**Authority & Scope**
- You operate with global read access across tenants and users, and write access to admin-scoped resources.
- You must honor policy gates exposed by your tools (requires_admin_role, scope, tenant_id).
- You can view and analyze cross-user trends, fraud, audits, leaderboards, payouts, and system health.

**Goals**
1. Help admins monitor the platform (integrity, growth, revenue, support).
2. Run audits and generate reports (events accuracy, duplicate profiles, incentive eligibility, payout anomalies).
3. Curate and improve Global Knowledge used for better recommendations and quality.

**Output**
- Provide a concise answer.
- Include "Admin Actions Taken" listing ids/rows changed.`;

// Helper to execute tool calls
async function executeTool(toolName: string, args: any, supabaseClient: any, userId: string) {
  console.log(`Executing tool: ${toolName}`, args);
  
  try {
    switch (toolName) {
      case 'get_user_profile': {
        const { data: profile, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (error) throw error;
        return { success: true, data: profile };
      }

      case 'search_user_memory': {
        const { data, error } = await supabaseClient.functions.invoke('rocker-memory', {
          body: {
            action: 'search_memory',
            user_id: userId,
            ...args
          }
        });
        
        if (error) throw error;
        return data;
      }

      case 'write_memory': {
        const { data, error } = await supabaseClient.functions.invoke('rocker-memory', {
          body: {
            action: 'write_memory',
            user_id: userId,
            entry: {
              user_id: userId,
              tenant_id: '00000000-0000-0000-0000-000000000000',
              ...args
            }
          }
        });
        
        if (error) throw error;
        return data;
      }

      case 'search_entities': {
        const { data, error } = await supabaseClient.functions.invoke('entity-lookup', {
          body: {
            action: 'search',
            ...args
          }
        });
        
        if (error) throw error;
        return data;
      }

      case 'save_post': {
        const { data, error } = await supabaseClient.functions.invoke('save-post', {
          body: args
        });
        
        if (error) throw error;
        return data;
      }

      case 'reshare_post': {
        const { data, error } = await supabaseClient.functions.invoke('reshare-post', {
          body: args
        });
        
        if (error) throw error;
        return data;
      }

      case 'recall_content': {
        const { data, error } = await supabaseClient.functions.invoke('recall-content', {
          body: args
        });
        
        if (error) throw error;
        return data;
      }

      case 'create_event': {
        const { data, error } = await supabaseClient.functions.invoke('generate-event-form', {
          body: {
            eventRules: `Create a ${args.event_type || 'general'} event`,
            formType: 'registration'
          }
        });
        
        if (error) throw error;
        return { success: true, message: 'Event builder started', form: data };
      }

      default:
        return { success: false, error: 'Unknown tool: ' + toolName };
    }
  } catch (error) {
    console.error('Tool execution error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
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

    const { messages, mode = 'user' } = await req.json();

    // Check if admin mode
    let isAdmin = false;
    if (mode === 'admin') {
      const { data: roles } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      isAdmin = !!roles;
    }

    const systemPrompt = isAdmin ? ADMIN_SYSTEM_PROMPT : USER_SYSTEM_PROMPT;

    // Build tools for function calling
    const tools: any = [
      {
        type: "function",
        function: {
          name: "get_user_profile",
          description: "Get the current user's profile information",
          parameters: { type: "object", properties: {} }
        }
      },
      {
        type: "function",
        function: {
          name: "search_user_memory",
          description: "Search the user's stored memories and preferences",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
              tags: { type: "array", items: { type: "string" }, description: "Filter by tags" },
              limit: { type: "number", description: "Max results to return" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "write_memory",
          description: "Store a long-lived memory or preference for the user. Only use for durable information.",
          parameters: {
            type: "object",
            required: ["key", "value", "type"],
            properties: {
              key: { type: "string", description: "Unique key for this memory" },
              value: { type: "object", description: "The memory content" },
              type: { type: "string", enum: ["preference", "fact", "goal", "note"], description: "Memory type" },
              tags: { type: "array", items: { type: "string" }, description: "Tags" },
              confidence: { type: "number", description: "0-1 confidence score" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_entities",
          description: "Search horses, businesses, events, or users",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
              type: { type: "string", enum: ["horse", "business", "user"], description: "Entity type" },
              limit: { type: "number", description: "Max results" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "save_post",
          description: "Save/bookmark a post for later reference",
          parameters: {
            type: "object",
            required: ["post_id"],
            properties: {
              post_id: { type: "string", description: "UUID of the post to save" },
              collection: { type: "string", description: "Collection name (optional, defaults to 'All')" },
              note: { type: "string", description: "Personal note about this save" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "reshare_post",
          description: "Reshare a post with optional commentary",
          parameters: {
            type: "object",
            required: ["post_id"],
            properties: {
              post_id: { type: "string", description: "UUID of the post to reshare" },
              commentary: { type: "string", description: "Your commentary on the post" },
              visibility: { 
                type: "string", 
                enum: ["public", "followers", "private"],
                description: "Who can see this reshare" 
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "recall_content",
          description: "Find previously saved posts, profiles, or horses using natural language",
          parameters: {
            type: "object",
            required: ["query"],
            properties: {
              query: { 
                type: "string", 
                description: "Natural language query like 'that Kinnon barrel video' or 'Sarah's horse profile'" 
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_event",
          description: "Start the conversational event builder to create a new event",
          parameters: {
            type: "object",
            properties: {
              event_type: { 
                type: "string", 
                enum: ["barrel_race", "pole_bending", "rodeo", "jackpot", "show"],
                description: "Type of event to create" 
              }
            }
          }
        }
      }
    ];

    // Tool calling loop
    let conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];
    
    let maxIterations = 5;
    let iterations = 0;

    while (iterations < maxIterations) {
      iterations++;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: conversationMessages,
          tools: tools,
          stream: false
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "OpenAI rate limits exceeded, please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "OpenAI payment required, please check your OpenAI account balance." }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error('OpenAI API error');
      }

      const completion = await response.json();
      const assistantMessage = completion.choices[0].message;

      // Check if AI wants to call tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Add assistant message with tool calls
        conversationMessages.push(assistantMessage);

        // Execute each tool
        for (const toolCall of assistantMessage.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);
          
          const result = await executeTool(toolName, toolArgs, supabaseClient, user.id);
          
          // Add tool result
          conversationMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          });
        }
        
        // Continue loop to get AI's response with tool results
        continue;
      } else {
        // No more tool calls, return final answer
        return new Response(
          JSON.stringify({ 
            content: assistantMessage.content,
            role: 'assistant'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Max iterations reached
    return new Response(
      JSON.stringify({ 
        content: "I apologize, but I've reached my processing limit for this request. Please try breaking it into smaller tasks.",
        role: 'assistant'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in rocker-chat:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
