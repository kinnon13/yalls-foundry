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

    // 2. Load rocker_memories (facts, preferences, goals)
    const { data: rockerMems } = await supabase
      .from('rocker_memories')
      .select('kind, key, value, tags')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(15);
    
    if (rockerMems?.length) {
      context += '\n\n## Additional Memories:\n' + rockerMems.map(m => `[${m.kind}] ${m.key}: ${JSON.stringify(m.value)}`).join('\n');
      console.log('[andy-chat] Loaded', rockerMems.length, 'rocker_memories');
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
      .select('title, description, start_time, end_time')
      .eq('user_id', user.id)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(10);

    if (events?.length) {
      context += '\n\n## Upcoming Events:\n' + events.map(e => `${e.title} (${e.start_time} - ${e.end_time})`).join('\n');
      console.log('[andy-chat] Loaded', events.length, 'events');
    }

    const systemPrompt = `You are Andy, the ultimate everything AI with FULL access to the user's complete data.

You have INSTANT access to:
- User memories, facts, preferences, and goals
- All uploaded files and knowledge base
- Tasks and calendar events
- Web search (just ask and I'll search)
- The ability to learn and remember from every conversation

Current Data:
${context || '(No data loaded yet - but you can still help!)'}

Be conversational, fast, and proactive. Always reference the user's actual data. When you learn something important (like someone's name, a preference, a goal), acknowledge it explicitly so I can save it.`;
    
    const finalMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    console.log('[andy-chat] Context size:', context.length, 'chars');

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
