import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface YAMLFrontMatter {
  title: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  scope: 'global' | 'site' | 'user';
  version?: number;
}

function parseYAMLFrontMatter(content: string): { meta: YAMLFrontMatter; body: string } {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    throw new Error('No YAML front-matter found');
  }

  const [, yamlStr, body] = match;
  
  // Simple YAML parser (basic key: value pairs)
  const meta: any = {};
  yamlStr.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value: any = line.slice(colonIndex + 1).trim();
      
      // Handle arrays [item1, item2]
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map((v: string) => v.trim());
      }
      // Handle numbers
      else if (!isNaN(Number(value))) {
        value = Number(value);
      }
      
      meta[key] = value;
    }
  });
  
  return { meta: meta as YAMLFrontMatter, body: body.trim() };
}

function chunkText(text: string, chunkSize = 1500, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
    
    if (start >= text.length) break;
  }
  
  return chunks;
}

async function generateEmbedding(text: string, openaiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, uri, tenant_id } = await req.json();
    
    if (!content || !uri) {
      return new Response(
        JSON.stringify({ error: 'content and uri required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: { user } } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    );

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[KB Ingest] Parsing content for URI:', uri);
    
    // Parse YAML front-matter
    const { meta, body } = parseYAMLFrontMatter(content);
    
    // Generate embedding for title + summary
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    let itemEmbedding: number[] | null = null;
    
    if (OPENAI_API_KEY) {
      const embeddingText = `${meta.title}\n${body.slice(0, 500)}`;
      itemEmbedding = await generateEmbedding(embeddingText, OPENAI_API_KEY);
    }

    // Upsert knowledge item
    const { data: item, error: itemError } = await supabaseClient
      .from('knowledge_items')
      .upsert({
        uri,
        scope: meta.scope,
        tenant_id: meta.scope === 'user' ? (tenant_id || user.id) : null,
        category: meta.category,
        subcategory: meta.subcategory,
        title: meta.title,
        summary: body.slice(0, 500),
        tags: meta.tags || [],
        version: meta.version || 1,
        content_excerpt: body.slice(0, 1000),
        embedding: itemEmbedding,
        created_by: user.id,
      })
      .select()
      .single();

    if (itemError) {
      console.error('[KB Ingest] Item error:', itemError);
      throw itemError;
    }

    console.log('[KB Ingest] Item created:', item.id);

    // Delete existing chunks
    await supabaseClient
      .from('knowledge_chunks')
      .delete()
      .eq('item_id', item.id);

    // Chunk content
    const chunks = chunkText(body);
    console.log('[KB Ingest] Created', chunks.length, 'chunks');

    // Insert chunks with embeddings
    const chunkData = [];
    for (let i = 0; i < chunks.length; i++) {
      let chunkEmbedding: number[] | null = null;
      
      if (OPENAI_API_KEY) {
        chunkEmbedding = await generateEmbedding(chunks[i], OPENAI_API_KEY);
      }

      chunkData.push({
        item_id: item.id,
        idx: i,
        text: chunks[i],
        embedding: chunkEmbedding,
        token_count: Math.ceil(chunks[i].length / 4), // Rough estimate
      });
    }

    const { error: chunksError } = await supabaseClient
      .from('knowledge_chunks')
      .insert(chunkData);

    if (chunksError) {
      console.error('[KB Ingest] Chunks error:', chunksError);
      throw chunksError;
    }

    console.log('[KB Ingest] Chunks inserted');

    // Extract playbook if content suggests intent
    const intentMatch = body.match(/intent:\s*([^\n]+)/i);
    if (intentMatch) {
      const intent = intentMatch[1].trim();
      console.log('[KB Ingest] Extracting playbook for intent:', intent);

      // Extract steps (look for numbered lists or step sections)
      const steps: any[] = [];
      const stepMatches = body.matchAll(/(?:^|\n)(?:\d+\.|[-*])\s*([^\n]+)/g);
      for (const match of stepMatches) {
        steps.push({
          action: match[1].trim(),
          description: match[1].trim(),
        });
      }

      if (steps.length > 0) {
        let playbookEmbedding: number[] | null = null;
        if (OPENAI_API_KEY) {
          playbookEmbedding = await generateEmbedding(intent, OPENAI_API_KEY);
        }

        await supabaseClient
          .from('playbooks')
          .upsert({
            intent,
            scope: meta.scope,
            tenant_id: meta.scope === 'user' ? (tenant_id || user.id) : null,
            steps,
            from_knowledge_uri: uri,
            embedding: playbookEmbedding,
          });

        console.log('[KB Ingest] Playbook created');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        item_id: item.id,
        chunks: chunks.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[KB Ingest] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
