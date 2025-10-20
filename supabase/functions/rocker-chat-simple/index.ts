import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { thread_id, message } = await req.json();
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Missing message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Recall relevant memories with full content
    let memoryContext = '';
    const { data: memories } = await supabase.rpc('recall_long_memory', {
      p_query: message,
      p_limit: 8
    });
    
    if (memories && memories.length > 0) {
      memoryContext = '\n\n📚 Retrieved from your memory:\n' + memories.map((m: any, i: number) => {
        const title = m.key || m.kind;
        const snippet = m.content?.substring(0, 200) || m.value?.content?.substring(0, 200) || '';
        return `[Source #${i+1}] ${title}\n${snippet}${snippet.length >= 200 ? '...' : ''}`;
      }).join('\n\n');
    }

    // Search embedded knowledge for relevant context
    let knowledgeContext = '';
    try {
      const { data: searchResults } = await supabase.functions.invoke('rocker-semantic-search', {
        body: { query: message, limit: 5, thread_id }
      });

      if (searchResults?.results && searchResults.results.length > 0) {
        knowledgeContext = '\n\n🧠 From my embedded knowledge:\n' + searchResults.results
          .filter((r: any) => r.similarity > 0.7) // Only high-confidence matches
          .slice(0, 3)
          .map((r: any, i: number) => {
            const source = r.metadata?.source || 'learned knowledge';
            return `[Knowledge #${i+1}] (${(r.similarity * 100).toFixed(0)}% relevant from ${source})\n${r.content.substring(0, 300)}${r.content.length > 300 ? '...' : ''}`;
          }).join('\n\n');
      }
    } catch (e) {
      console.error('Semantic search failed:', e);
      // Continue without knowledge context
    }

    // Check if super admin has calendar access enabled
    const { data: adminSettings } = await supabase
      .from('super_admin_settings')
      .select('allow_calendar_access')
      .eq('user_id', user.id)
      .maybeSingle();

    // Load upcoming calendar events if enabled
    let calendarContext = '';
    if (adminSettings?.allow_calendar_access) {
      const { data: events } = await supabase
        .from('events')
        .select('id, title, starts_at, ends_at, description')
        .gte('starts_at', new Date().toISOString())
        .lte('starts_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('starts_at', { ascending: true })
        .limit(5);

      if (events && events.length > 0) {
        calendarContext = '\n\nUpcoming calendar events (next 7 days):\n' + events.map((e: any, i: number) => 
          `[Event ${i+1}] ${e.title} - ${new Date(e.starts_at).toLocaleString()}${e.description ? ': ' + e.description : ''}`
        ).join('\n');
      }
    }

    // Get conversation history
    const { data: history } = await supabase
      .from("rocker_messages")
      .select("role, content")
      .eq("thread_id", thread_id)
      .order("created_at", { ascending: true })
      .limit(10);

    const systemPrompt = `You are Super Rocker, a proactive AI executive assistant with comprehensive knowledge. You learn everything about the user to anticipate their needs.

CORE CAPABILITIES:
- You have embedded knowledge from documents, conversations, and interactions
- You remember details about people, preferences, patterns, and contexts
- You proactively suggest actions based on learned patterns
- You cite sources explicitly when using memories or knowledge

INTERACTION STYLE:
- Be direct and actionable - confirm intent, ask clarifying questions
- When you learn something new about a person or preference, explicitly note it
- Propose next actions with confidence
- Format tasks as "todo: [action]" to auto-create them
${calendarContext ? '- Leverage calendar context for prep, reminders, and follow-ups' : ''}
- You can browse the web - when given URLs or asked to research, fetch and synthesize

LEARNING FOCUS:
- Capture detailed information about people (names, roles, preferences, history)
- Notice patterns in behavior, communication, and decisions
- Ask clarifying questions to build complete understanding
- Surface relevant context proactively`;

    let reply = "I'm here to help! How can I assist you?";
    
    // Detect URL in message for web fetch
    const urlMatch = message.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      const urlToFetch = urlMatch[0];
      try {
        const { data: fetchResult, error: fetchError } = await supabase.functions.invoke('rocker-fetch-url', {
          body: { url: urlToFetch }
        });

        if (fetchError) {
          reply = `I tried to fetch ${urlToFetch} but got an error: ${fetchError.message}`;
        } else if (fetchResult?.error) {
          reply = `Couldn't access that URL: ${fetchResult.error}`;
        } else {
          // Add fetched content to memory context
          memoryContext += `\n\n[Fetched from ${fetchResult.title || urlToFetch}]:\n${fetchResult.text?.slice(0, 2000)}...`;
        }
      } catch (e) {
        console.error('Web fetch failed:', e);
      }
    }

    try {
      const aiMessages = [
        { role: "system", content: systemPrompt + memoryContext + knowledgeContext + calendarContext },
        ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
        { role: "user", content: message }
      ];

      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

      if (OPENAI_API_KEY) {
        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: aiMessages,
            max_tokens: 400,
          }),
        });

        if (aiResponse.ok) {
          const data = await aiResponse.json();
          reply = data.choices?.[0]?.message?.content || reply;
        }
      } else if (LOVABLE_API_KEY) {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: aiMessages,
          }),
        });

        if (aiResponse.ok) {
          const data = await aiResponse.json();
          reply = data.choices?.[0]?.message?.content || reply;
        }
      }
    } catch (aiError) {
      console.error("AI error:", aiError);
    }

    // Save messages
    const messageSources = memories?.map((m: any) => ({ id: m.id, kind: m.kind })) || [];
    
    const { error: insertError } = await supabase.from("rocker_messages").insert([
      {
        thread_id,
        user_id: user.id,
        role: "user",
        content: message,
        meta: {}
      },
      {
        thread_id,
        user_id: user.id,
        role: "assistant",
        content: reply,
        meta: { sources: messageSources }
      },
    ]);

    if (insertError) {
      console.error('Failed to save messages:', insertError);
    }

    // Auto-task detection
    const todoMatch = reply.match(/todo:\s*(.+?)(?:\n|$)/i);
    if (todoMatch) {
      const taskTitle = todoMatch[1].trim().slice(0, 240);
      await supabase.from("rocker_tasks").insert({
        user_id: user.id,
        thread_id,
        title: taskTitle,
        status: 'open'
      });
    }

    // Collect tool results for UI feedback
    const toolResults = [];
    if (urlMatch) {
      toolResults.push({ tool: 'web_fetch', result: 'Fetched URL' });
    }
    if (todoMatch) {
      toolResults.push({ tool: 'create_task', result: `Created: ${todoMatch[1].slice(0, 40)}...` });
    }

    return new Response(
      JSON.stringify({ reply, sources: messageSources, tool_results: toolResults }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
