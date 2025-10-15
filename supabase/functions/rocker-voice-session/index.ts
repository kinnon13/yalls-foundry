import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Get user session
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { alwaysListening } = await req.json();

    const baseInstructions = `You are Rocker, an ACTION-TAKING voice AI assistant for Yall's Foundry.

**CRITICAL: You are ACTION-ORIENTED via Voice**
When users speak a command, you MUST use your tools immediately:
- "Go to horses" → navigate({path: "/horses"})
- "Open marketplace" → navigate({path: "/marketplace"})
- "Click submit" → click_element({element_name: "submit button"})
- "Post this: Hello world" → create_post({content: "Hello world"})
- "Fill title with My Horse" → fill_field({field_name: "title", value: "My Horse"})

**Your Tools (Voice Commands):**
1. navigate - Opens pages: /horses, /events, /marketplace, /profile, /dashboard, 'back'
2. click_element - Clicks buttons/links on current page
3. fill_field - Fills form fields with values
4. create_post - Creates a new post with content

**Voice Command Patterns:**
- Navigation: "go to", "open", "show me", "take me to"
- Clicking: "click", "press", "hit", "tap"
- Posting: "post", "share", "publish", "say"
- Filling: "type", "enter", "fill", "set"

**IMPORTANT:**
- Call tools IMMEDIATELY when you detect action words
- Confirm actions verbally: "Opening horses now" or "Posting that"
- Keep responses VERY brief - users are speaking, not reading
- If stop command ("stop", "stop talking"), end immediately
- Stay friendly and enthusiastic about horses!`;

    const alwaysListeningInstructions = alwaysListening 
      ? `\n\nIMPORTANT: You are in "always listening" mode. Only respond when the user addresses you by saying "Rocker" or "Hey Rocker" at the start of their message. If they speak without saying your name, stay silent and wait. When they do say "Rocker", respond helpfully to their request.`
      : '';

    // Tool definitions for voice commands
    const tools = [
      {
        type: "function" as const,
        name: "navigate",
        description: "Navigate to a different page. Use when user asks to open, go to, or view a page.",
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to navigate to (e.g., /horses, /events, /marketplace, /profile, /dashboard, /search)",
            }
          },
          required: ["path"]
        }
      },
      {
        type: "function" as const,
        name: "click_element",
        description: "Click a button or element on the current page.",
        parameters: {
          type: "object",
          properties: {
            element_name: {
              type: "string",
              description: "What to click (e.g., 'submit button', 'post button', 'save')",
            }
          },
          required: ["element_name"]
        }
      },
      {
        type: "function" as const,
        name: "fill_field",
        description: "Fill in a form field.",
        parameters: {
          type: "object",
          properties: {
            field_name: {
              type: "string",
              description: "Field to fill (e.g., 'title', 'description', 'message')",
            },
            value: {
              type: "string",
              description: "Value to enter",
            }
          },
          required: ["field_name", "value"]
        }
      },
      {
        type: "function" as const,
        name: "create_post",
        description: "Create a new post with the given content.",
        parameters: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "Post content",
            }
          },
          required: ["content"]
        }
      },
      {
        type: "function" as const,
        name: "scroll_page",
        description: "Scroll the page up or down.",
        parameters: {
          type: "object",
          properties: {
            direction: {
              type: "string",
              enum: ["up", "down", "top", "bottom"],
              description: "Direction to scroll",
            },
            amount: {
              type: "string",
              enum: ["page", "screen", "little"],
              description: "How much to scroll",
            }
          }
        }
      }
    ];

    // Create ephemeral token for Realtime API
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: baseInstructions + alwaysListeningInstructions,
        tools: tools,
        tool_choice: "auto"
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI session error:", error);
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Session created successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
