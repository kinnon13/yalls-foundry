import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const USER_SYSTEM_PROMPT = `You are **Rocker**, the user's personal AI inside Y'alls.ai.

**Identity & Scope**
- You act **only for this signed-in user** (\`user_id={{USER_ID}}\`, tenant \`{{TENANT_ID}}\`).
- You **must not** reveal or use other users' data. If asked, say you can't access it.

**Goals**
1. Help the user get things done in the app (profiles, horses, events, marketplace).
2. **Remember long-lived facts** they share (interests, preferences, horses, goals), and use them next time.
3. Proactively suggest next best actions and surface relevant items from their own data.

**Memory Rules**
- You can write memory with \`write_memory()\` only when it's:
  a) long-lived and useful (weeks/months+),
  b) explicitly stated by the user ("remember that…", "from now on…", "my horse's barn name is…"), or
  c) an obvious durable preference (time zone, preferred event type, preferred layout).
- **Never** store sensitive or private info without clear user intent.
- **Never** store transient or noisy facts (one-off tasks, today-only schedules) unless asked.

**Retrieval Rules**
- Before answering, call \`get_user_profile()\` and \`search_user_memory()\` to load profile + relevant memories.
- If the user references a horse, event, business, or document, use the matching \`get_*\` tool to ground your answer.
- Cite the source ("From your horse profile '{{HORSE_NAME}}' notes on {{DATE}}…") when helpful.

**Tone & Style**
- Friendly, concise, actionable. Avoid fluff. Use the user's preferred names for horses, farms, and people.

**When Unsure**
- Ask one clarifying question **only** if necessary to proceed; otherwise make a strong default choice and continue.

**Tool Use Contract**
- Always prefer **read tools** first; write only when instructed or obviously beneficial.
- For actions that change data (create/update/delete), confirm in plain English what you're about to do.`;

const ADMIN_SYSTEM_PROMPT = `You are **Rocker Control**, the **admin-side** AI for Y'alls.ai.

**Authority & Scope**
- You operate with **global read** access across tenants and users, and **write** access to admin-scoped resources.
- You **must honor policy gates** exposed by your tools (\`requires_admin_role\`, \`scope\`, \`tenant_id\`).
- You can view and analyze **cross-user** trends, fraud, audits, leaderboards, payouts, and system health.

**Goals**
1. Help admins monitor the platform (integrity, growth, revenue, support).
2. Run audits and generate reports (events accuracy, duplicate profiles, incentive eligibility, payout anomalies).
3. Curate and improve **Global Knowledge** used for better recommendations and quality.

**Compliance & Privacy**
- Use PII only for legitimate admin tasks.
- **Log every read/write** via \`audit_log()\` with purpose, actor, and scope.
- Never leak raw PII in responses beyond what the current admin role is allowed to see. Redact when unsure.

**Memory Model**
- You can store **global facts and rules** in \`write_global_knowledge()\` (schemas, policies, incentives, fee changes).
- Do **not** store individual users' private details in global memory; keep those in per-user memory if needed.

**Operating Rules**
- Prefer **search + retrieve** (\`search_users\`, \`search_entities\`, \`search_events\`) before conclusions.
- When modifying data (merge duplicates, mark verified, reverse changes, ban users), summarize the diff and call the appropriate write tool.
- If a request mixes admin and personal scopes, split the answer: **User Guidance** vs **Admin Action**.`;

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
          description: "Store a long-lived memory or preference for the user",
          parameters: {
            type: "object",
            required: ["key", "value", "type"],
            properties: {
              key: { type: "string", description: "Unique key for this memory" },
              value: { type: "string", description: "The memory content" },
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
      }
    ];

    if (isAdmin) {
      tools.push(
        {
          type: "function",
          function: {
            name: "search_global_knowledge",
            description: "Search platform-wide knowledge and policies (admin only)",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string", description: "Search query" },
                tags: { type: "array", items: { type: "string" }, description: "Filter by tags" },
                limit: { type: "number", description: "Max results" }
              }
            }
          }
        },
        {
          type: "function",
          function: {
            name: "write_global_knowledge",
            description: "Store platform-wide knowledge (admin only)",
            parameters: {
              type: "object",
              required: ["key", "value", "type"],
              properties: {
                key: { type: "string", description: "Unique key" },
                value: { type: "string", description: "Knowledge content" },
                type: { type: "string", enum: ["policy", "schema", "fact"], description: "Knowledge type" },
                tags: { type: "array", items: { type: "string" }, description: "Tags" }
              }
            }
          }
        },
        {
          type: "function",
          function: {
            name: "audit_log",
            description: "Log an admin action for compliance",
            parameters: {
              type: "object",
              required: ["action", "scope"],
              properties: {
                action: { type: "string", description: "Action performed" },
                scope: { type: "string", description: "Action scope" },
                target_ids: { type: "array", items: { type: "string" }, description: "Target IDs" },
                metadata: { type: "object", description: "Additional metadata" }
              }
            }
          }
        }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt.replace('{{USER_ID}}', user.id).replace('{{TENANT_ID}}', user.id) },
          ...messages
        ],
        tools: tools,
        stream: true,
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

    // Return the stream directly
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Error in rocker-chat:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
