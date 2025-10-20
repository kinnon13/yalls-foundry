import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

function chunkText(text: string, maxSize = 8000, overlap = 600): string[] {
  const parts: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(text.length, i + maxSize);
    parts.push(text.slice(i, end));
    i = end - overlap;
    if (i >= end) break;
  }
  return parts;
}

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

    const { text, subject, thread_id } = await req.json();
    
    if (!text) {
      return new Response(JSON.stringify({ error: 'Missing text' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ensure thread exists
    let threadId = thread_id;
    if (!threadId) {
      const { data: thread, error: threadError } = await supabase
        .from('rocker_threads')
        .insert({ user_id: user.id, subject: subject || 'Super Rocker Memory' })
        .select()
        .single();
      
      if (threadError) throw threadError;
      threadId = thread.id;
    }

    // Chunk the text
    const chunks = chunkText(text);
    
    // Check if super admin for priority
    const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { p_uid: user.id });
    const priority = isSuperAdmin ? 10 : 100;

    // Auto-categorize using AI (single fast call)
    let category = 'Notes';
    let summary = text.slice(0, 200) + '...';
    let tags: string[] = [];

    // Skip AI for very large texts to avoid timeouts
    if (LOVABLE_API_KEY && text.length < 50000) {
      try {
        // Single combined AI call for better performance
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite',
            messages: [{
              role: 'user',
              content: `Analyze this content and return JSON with category, summary, and tags.

Subject: ${subject || 'Untitled'}
Content: ${text.slice(0, 3000)}

Return JSON in this exact format:
{
  "category": "One of: Projects, People, Finance, Legal, Marketing, Product, Personal, Notes",
  "summary": "1-2 sentence summary",
  "tags": ["tag1", "tag2", "tag3"]
}`
            }],
            max_completion_tokens: 200,
          }),
        });
        
        if (aiResponse.ok) {
          const data = await aiResponse.json();
          const content = data.choices?.[0]?.message?.content || '{}';
          const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
          category = parsed.category || 'Notes';
          summary = parsed.summary || summary;
          tags = Array.isArray(parsed.tags) ? parsed.tags : [];
        }
      } catch (aiError) {
        console.error('AI processing error:', aiError);
      }
    } else if (text.length >= 50000) {
      summary = `Large document (${Math.round(text.length / 1000)}KB)`;
      category = 'Documents';
    }

    // Insert chunks into memory
    const memoryInserts = chunks.map((chunk, idx) => ({
      user_id: user.id,
      kind: 'paste',
      key: `${category.toLowerCase()}_${Date.now()}_${idx}`,
      value: { text: chunk, subject: subject || category, category, tags },
      priority,
      pinned: isSuperAdmin,
      source: 'ingest'
    }));

    const { data: memories, error: memError } = await supabase
      .from('rocker_long_memory')
      .insert(memoryInserts)
      .select();

    if (memError) throw memError;

    // Log action
    await supabase.from('ai_action_ledger').insert({
      user_id: user.id,
      agent: 'rocker',
      action: 'memory_ingest',
      input: { chunks: chunks.length, size: text.length },
      output: { 
        thread_id: threadId, 
        memories: memories.length,
        category,
        tags: tags.slice(0, 5)
      },
      result: 'success'
    });

    return new Response(JSON.stringify({ 
      thread_id: threadId, 
      stored: memories.length,
      chunks: chunks.length,
      category,
      tags,
      summary: summary.slice(0, 150)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Ingest error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});