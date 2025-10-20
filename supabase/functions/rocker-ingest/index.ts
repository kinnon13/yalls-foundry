import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

function chunkText(text: string, maxSize = 3000, overlap = 150): string[] {
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
    
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing text' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const MAX_CHARS = 120_000; // Limit to 120KB to be extra safe in edge memory
    if (text.length > MAX_CHARS) {
      return new Response(JSON.stringify({ error: `Text too large (${Math.round(text.length/1000)}KB). Max 120KB.` }), {
        status: 413,
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

    // Check if super admin for priority
    const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { _user_id: user.id });
    const priority = isSuperAdmin === true ? 10 : 100;

    // Simple categorization
    let category = 'Notes';
    let summary = text.slice(0, 150);
    const tags: string[] = [];

    if (text.length > 5000) {
      summary = `Document (${Math.round(text.length / 1000)}KB)`;
    } else if (subject && subject.toLowerCase() !== 'super rocker memory') {
      category = subject.slice(0, 50);
    }

    // Store chunks in rocker_knowledge (embeddings filled by scheduled worker)
    const chunks = chunkText(text, 2000, 100); // Smaller chunks for better embeddings
    const MAX_CHUNKS = 150;
    const totalChunks = Math.min(chunks.length, MAX_CHUNKS);
    
    let storedCount = 0;
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < totalChunks; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE, totalChunks);
      const batch = [];
      
      for (let j = i; j < batchEnd; j++) {
        batch.push({
          user_id: user.id,
          content: chunks[j],
          chunk_index: j,
          meta: { 
            subject: subject || category, 
            category, 
            tags, 
            source: 'paste',
            total_chunks: totalChunks
          }
        });
      }
      
      const { error } = await supabase
        .from('rocker_knowledge')
        .insert(batch);
      if (error) throw error;
      storedCount += batch.length;
    }

    // Log action
    await supabase.from('ai_action_ledger').insert({
      user_id: user.id,
      agent: 'rocker',
      action: 'memory_ingest',
      input: { chunks: chunks.length, size: text.length },
      output: { 
        thread_id: threadId, 
        memories: storedCount,
        category,
        tags: tags.slice(0, 5)
      },
      result: 'success'
    });

    return new Response(JSON.stringify({ 
      thread_id: threadId, 
      stored: storedCount,
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