import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";
import { ai } from "../_shared/ai.ts";

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

async function generateEmbedding(text: string): Promise<number[]> {
  const vectors = await ai.embed('knower', [text]);
  return vectors[0];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await withRateLimit(req, 'kb-ingest', RateLimits.expensive);
  if (limited) return limited;

  const log = createLogger('kb-ingest');
  log.startTimer();

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

    log.info('KB ingest started', { uri });
    
    // Parse YAML front-matter
    const { meta, body } = parseYAMLFrontMatter(content);
    
    // Generate embedding for title + summary
    let itemEmbedding: number[] | null = null;
    
    try {
      const embeddingText = `${meta.title}\n${body.slice(0, 500)}`;
      itemEmbedding = await generateEmbedding(embeddingText);
    } catch (err) {
      log.error('Item embedding failed', err);
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
      log.error('KB item creation error', itemError);
      throw itemError;
    }

    log.info('KB item created', { itemId: item.id });

    // Delete existing chunks
    await supabaseClient
      .from('knowledge_chunks')
      .delete()
      .eq('item_id', item.id);

    // Chunk content
    const chunks = chunkText(body);
    log.info('Chunks created', { count: chunks.length });

    // Insert chunks with embeddings
    const chunkData = [];
    for (let i = 0; i < chunks.length; i++) {
      let chunkEmbedding: number[] | null = null;
      
      try {
        chunkEmbedding = await generateEmbedding(chunks[i]);
      } catch (err) {
        log.error(`Chunk ${i} embedding failed`, err);
      }

      chunkData.push({
        item_id: item.id,
        idx: i,
        text: chunks[i],
        embedding: chunkEmbedding,
        token_count: Math.ceil(chunks[i].length / 4),
      });
    }

    const { error: chunksError } = await supabaseClient
      .from('knowledge_chunks')
      .insert(chunkData);

    if (chunksError) {
      log.error('KB chunks insert error', chunksError);
      throw chunksError;
    }

    log.info('Chunks inserted successfully');

    // Extract playbook if content suggests intent
    const intentMatch = body.match(/intent:\s*([^\n]+)/i);
    if (intentMatch) {
      const intent = intentMatch[1].trim();
      log.info('Extracting playbook', { intent });

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
        try {
          playbookEmbedding = await generateEmbedding(intent);
        } catch (err) {
          log.error('Playbook embedding failed', err);
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

        log.info('Playbook created successfully');
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
    log.error('KB ingest error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
