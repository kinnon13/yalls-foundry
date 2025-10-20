import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

function chunkText(text: string, maxSize = 4000, overlap = 200): string[] {
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

    const MAX_CHARS = 500_000; // 500KB max
    if (text.length > MAX_CHARS) {
      return new Response(JSON.stringify({ error: `Text too large (${Math.round(text.length/1000)}KB). Max 500KB.` }), {
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

    // Process chunks ONE AT A TIME to avoid memory spikes
    const chunks = chunkText(text);
    const MAX_CHUNKS = 250;
    const totalChunks = Math.min(chunks.length, MAX_CHUNKS);
    
    let storedCount = 0;
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < totalChunks; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE, totalChunks);
      const batch = [];
      
      for (let j = i; j < batchEnd; j++) {
        batch.push({
          user_id: user.id,
          kind: 'paste',
          key: `${category.toLowerCase()}_${Date.now()}_${j}`,
          value: { text: chunks[j], subject: subject || category, category, tags },
          priority,
          pinned: isSuperAdmin === true,
          source: 'ingest'
        });
      }
      
      const { data, error } = await supabase
        .from('rocker_long_memory')
        .insert(batch)
        .select('id');
      
      if (error) throw error;
      storedCount += data?.length || 0;
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