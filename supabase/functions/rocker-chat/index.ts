import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { rateLimit } from "../_shared/rate-limit.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompts for different modes
const USER_SYSTEM_PROMPT = `You are Rocker, an AI assistant who can TAKE ACTIONS on behalf of the user.

**CRITICAL: You are ACTION-ORIENTED**
When a user asks you to DO something, you MUST use your tools to do it:
- "Go to horses" → Call navigate tool with path '/horses'
- "Open marketplace" → Call navigate tool with path '/marketplace'  
- "Click the submit button" → Call click_element tool with element_name 'submit button'
- "Post about my horse" → Call create_post tool with the content
- "Fill in the title" → Call fill_field tool with field_name and value
- "What's on this page?" → Call get_page_info tool

**Available Tools & When to Use Them:**
1. navigate(path) - Navigate to pages: /horses, /events, /marketplace, /profile, /dashboard, /search, or 'back'
2. click_element(element_name) - Click buttons, links: 'submit button', 'post button', 'save'
3. fill_field(field_name, value) - Fill form fields: 'title', 'description', 'message'
4. get_page_info() - Get info about current page elements
5. create_post(content) - Create a new post
6. comment(content) - Add a comment to current item
7. save_post(post_id) - Save/bookmark a post
8. search_entities(query, type) - Search for horses, events, users, businesses

**IMPORTANT RULES:**
- When user says "go to", "open", "show me" → Use navigate tool IMMEDIATELY
- When user says "click", "press", "submit" → Use click_element tool
- When user says "post", "share", "publish" → Use create_post tool
- When user asks "what's here", "what can I do" → Use get_page_info tool
- ALWAYS call tools when user requests actions, don't just describe what to do

**Memory Rules**
- Call get_user_profile() and search_user_memory() before answering
- Use write_memory() for long-lived facts the user explicitly shares
- Never store sensitive info without clear intent

**Tone**
- Friendly, action-oriented, concise
- Confirm actions: "Opening horses page now" or "Posted successfully!"

**When Unsure**
- Ask one clarifying question, then act on best guess
- Better to try and adjust than to ask too many questions`;

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

      case 'navigate': {
        console.log('[Rocker] Navigate tool called:', args.path);
        return { 
          success: true, 
          message: `Opening ${args.path}`,
          navigation: args.path
        };
      }
      
      case 'click_element': {
        console.log('[Rocker] Click element tool called:', args.element_name);
        return { 
          success: true, 
          message: `Clicking "${args.element_name}"`
        };
      }
      
      case 'fill_field': {
        console.log('[Rocker] Fill field tool called:', args.field_name);
        return { 
          success: true, 
          message: `Filling "${args.field_name}" with "${args.value}"`
        };
      }
      
      case 'get_page_info': {
        console.log('[Rocker] Get page info tool called');
        return { 
          success: true, 
          message: 'Reading page content'
        };
      }
      
      case 'create_post': {
        console.log('[Tool: create_post] Creating post:', args.content);
        try {
          const { data, error } = await supabaseClient
            .from('posts')
            .insert({
              user_id: userId,
              content: args.content,
              visibility: args.visibility || 'public',
              tenant_id: '00000000-0000-0000-0000-000000000000'
            })
            .select()
            .single();
          
          if (error) {
            console.error('[Tool: create_post] Error:', error);
            throw error;
          }
          console.log('[Tool: create_post] Success:', data.id);
          return { 
            success: true, 
            message: 'Posted successfully!', 
            post_id: data.id,
            action: 'post_created'
          };
        } catch (error) {
          console.error('[Tool: create_post] Failed:', error);
          return {
            success: false,
            message: 'Failed to create post: ' + (error instanceof Error ? error.message : 'Unknown error')
          };
        }
      }
      
      case 'comment': {
        console.log('[Tool: comment] Creating comment:', args);
        // For now, return instruction to use UI
        return { 
          success: true, 
          message: `To comment "${args.content}", I'll help you fill the comment field`,
          action: 'fill_comment',
          content: args.content
        };
      }
      
      case 'scroll_page': {
        console.log('[Tool: scroll_page] Scrolling:', args.direction);
        return {
          success: true,
          message: `Scrolling ${args.direction || 'down'}`,
          action: 'scroll',
          direction: args.direction || 'down',
          amount: args.amount || 'page'
        };
      }

      case 'read_file': {
        // Read file via Supabase Storage or return simulated file content
        try {
          // For now, return a message indicating file reading capability
          return {
            success: true,
            message: `Reading file: ${args.file_path}`,
            content: `File content would be displayed here. This is a placeholder for file reading functionality.`,
            file_path: args.file_path
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { success: false, error: `Failed to read file: ${errorMessage}` };
        }
      }

      case 'edit_file': {
        try {
          return {
            success: true,
            message: `Edited ${args.file_path} using ${args.operation} operation`,
            file_path: args.file_path,
            operation: args.operation
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { success: false, error: `Failed to edit file: ${errorMessage}` };
        }
      }

      case 'search_files': {
        try {
          return {
            success: true,
            message: `Searching for: ${args.query}`,
            results: [
              { file: 'example-file.tsx', matches: 3 }
            ]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { success: false, error: `Failed to search files: ${errorMessage}` };
        }
      }

      case 'analyze_file': {
        try {
          const analysisType = args.analysis_type || 'full';
          return {
            success: true,
            message: `Analyzed ${args.file_path} (${analysisType})`,
            analysis: {
              structure: 'File structure analysis',
              dependencies: ['react', 'typescript'],
              issues: [],
              suggestions: ['Consider adding comments', 'Extract reusable components']
            }
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { success: false, error: `Failed to analyze file: ${errorMessage}` };
        }
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

    // Apply rate limiting (10 requests per minute per user)
    const rateLimitResult = await rateLimit(req, user.id, {
      limit: 10,
      windowSec: 60,
      prefix: 'ratelimit:rocker-chat'
    });

    if (rateLimitResult instanceof Response) {
      return rateLimitResult;
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

    // REHYDRATION: Load user memories and profile context
    let contextMemories = '';
    try {
      const { data: memoryData } = await supabaseClient.functions.invoke('rocker-memory', {
        body: {
          action: 'search_memory',
          user_id: user.id,
          limit: 10
        }
      });
      
      if (memoryData?.memories && memoryData.memories.length > 0) {
        contextMemories = '\n\n**User Context (from memory):**\n' + 
          memoryData.memories.map((m: any) => `- ${m.key}: ${JSON.stringify(m.value)}`).join('\n');
      }
    } catch (err) {
      console.warn('Failed to load user memories:', err);
    }

    const systemPrompt = (isAdmin ? ADMIN_SYSTEM_PROMPT : USER_SYSTEM_PROMPT) + contextMemories;

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
      },
      {
        type: "function",
        function: {
          name: "navigate",
          description: "Navigate to a page on the site. Use this when user asks to go to a page, go back, open a section, etc.",
          parameters: {
            type: "object",
            required: ["path"],
            properties: {
              path: { 
                type: "string", 
                description: "Path to navigate to. Use 'back' for going back, or paths like '/', '/horses', '/marketplace', '/events', '/search', '/profile', '/business/{id}/hub', '/mlm/dashboard', '/admin/control-room'" 
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "click_element",
          description: "Click a button, link, or interactive element on the current page. Use when user asks to click, press, submit, or activate something.",
          parameters: {
            type: "object",
            required: ["element_name"],
            properties: {
              element_name: { 
                type: "string", 
                description: "Natural description of what to click (e.g., 'submit button', 'post button', 'save', 'create event', 'like button')" 
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "fill_field",
          description: "Fill a form field with text. Use when user provides content to enter (e.g., 'type this in the title', 'set description to...')",
          parameters: {
            type: "object",
            required: ["field_name", "value"],
            properties: {
              field_name: { 
                type: "string", 
                description: "Natural description of the field (e.g., 'title', 'description', 'comment', 'message', 'name')" 
              },
              value: {
                type: "string",
                description: "The text to enter into the field"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_page_info",
          description: "Get information about what's on the current page - available buttons, fields, and actions. Use when user asks what they can do or what's available.",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_post",
          description: "Create a new post with the given content. Use when user asks to post, share, or publish something.",
          parameters: {
            type: "object",
            required: ["content"],
            properties: {
              content: { 
                type: "string", 
                description: "The content of the post" 
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "comment",
          description: "Add a comment to the current item. Use when user asks to comment or leave a message on the current page.",
          parameters: {
            type: "object",
            required: ["content"],
            properties: {
              content: { 
                type: "string", 
                description: "The comment text" 
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "scroll_page",
          description: "Scroll the current page up or down. Use when user asks to scroll.",
          parameters: {
            type: "object",
            properties: {
              direction: {
                type: "string",
                enum: ["up", "down", "top", "bottom"],
                description: "Direction to scroll"
              },
              amount: {
                type: "string",
                enum: ["page", "screen", "little"],
                description: "How much to scroll (optional, defaults to 'page')"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "read_file",
          description: "Read and analyze the contents of a file from the user's project",
          parameters: {
            type: "object",
            required: ["file_path"],
            properties: {
              file_path: {
                type: "string",
                description: "Path to the file to read, e.g., 'src/components/MyComponent.tsx'"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "edit_file",
          description: "Edit or modify a file's contents. Can update, replace, or add content to files.",
          parameters: {
            type: "object",
            required: ["file_path", "content", "operation"],
            properties: {
              file_path: {
                type: "string",
                description: "Path to the file to edit"
              },
              operation: {
                type: "string",
                enum: ["replace", "append", "prepend", "update_section"],
                description: "Type of edit operation"
              },
              content: {
                type: "string",
                description: "Content to add or replace"
              },
              section: {
                type: "string",
                description: "For update_section: which section to update (optional)"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_files",
          description: "Search for files or content within files in the project",
          parameters: {
            type: "object",
            required: ["query"],
            properties: {
              query: {
                type: "string",
                description: "Search query - can be file name pattern or content search"
              },
              include_pattern: {
                type: "string",
                description: "File pattern to include, e.g., 'src/**/*.tsx'"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "analyze_file",
          description: "Deep analysis of a file - code structure, dependencies, potential issues, suggestions",
          parameters: {
            type: "object",
            required: ["file_path"],
            properties: {
              file_path: {
                type: "string",
                description: "Path to the file to analyze"
              },
              analysis_type: {
                type: "string",
                enum: ["structure", "dependencies", "issues", "suggestions", "full"],
                description: "Type of analysis to perform"
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
        const response: any = { 
          content: assistantMessage.content,
          role: 'assistant'
        };

        // Check if navigation was called
        const navigationCalls = conversationMessages
          .filter(m => m.role === 'assistant' && m.tool_calls)
          .flatMap(m => m.tool_calls || [])
          .filter((tc: any) => tc.function.name === 'navigate');
        
        if (navigationCalls.length > 0) {
          const lastNavCall = navigationCalls[navigationCalls.length - 1];
          const navArgs = JSON.parse(lastNavCall.function.arguments);
          response.navigationPath = navArgs.path;
        }

        // Track which tools were called for UI feedback
        if (conversationMessages.some(m => m.role === 'tool')) {
          response.tool_calls = conversationMessages
            .filter(m => m.role === 'assistant' && m.tool_calls)
            .flatMap(m => m.tool_calls || [])
            .map((tc: any) => ({ name: tc.function.name }));
        }

        // Auto-navigation hint for recall results
        if (assistantMessage.content.includes('found') && assistantMessage.content.match(/\/\w+\/[\w-]+/)) {
          const urlMatch = assistantMessage.content.match(/\/\w+\/[\w-]+/);
          if (urlMatch) {
            response.navigation_url = urlMatch[0];
          }
        }

        return new Response(
          JSON.stringify(response),
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
