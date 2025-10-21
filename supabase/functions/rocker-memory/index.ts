import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { withRateLimit, getTenantFromJWT, RateLimits } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";
import { ai } from "../_shared/ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MemoryEntry {
  user_id?: string;
  tenant_id: string;
  type: 'preference' | 'fact' | 'goal' | 'note' | 'policy' | 'schema' | 'relationship';
  key: string;
  value: any;
  confidence?: number;
  source?: string;
  tags?: string[];
  expires_at?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await withRateLimit(req, 'rocker-memory', RateLimits.standard);
  if (limited) return limited;

  const log = createLogger('rocker-memory');
  log.startTimer();

  try {
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

    const tenantId = getTenantFromJWT(req) ?? user.id;
    const { action, ...params } = await req.json();

    switch (action) {
      case 'get_profile':
        return await getUserProfile(supabaseClient, user.id);
      
      case 'search_memory':
        return await searchUserMemory(supabaseClient, user.id, params);
      
      case 'write_memory':
        return await writeMemory(supabaseClient, user.id, tenantId, params.entry);
      
      case 'delete_memory':
        return await deleteMemory(supabaseClient, user.id, params.id);
      
      case 'search_entities':
        return await searchEntities(supabaseClient, params);
      
      case 'generate_embedding':
        return await generateEmbedding(params.text);
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    log.error('Error in rocker-memory', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getUserProfile(supabase: any, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ profile }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function searchUserMemory(supabase: any, userId: string, params: any) {
  const { query, limit = 10, tags } = params;

  let queryBuilder = supabase
    .from('ai_user_memory')
    .select('*')
    .eq('user_id', userId)
    .or('expires_at.is.null,expires_at.gt.now()')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (tags && tags.length > 0) {
    queryBuilder = queryBuilder.contains('tags', tags);
  }

  // If query provided, do semantic search with embedding
  if (query) {
    const embedding = await generateEmbeddingVector(query);
    if (embedding) {
      queryBuilder = queryBuilder.order('embedding <-> ' + JSON.stringify(embedding));
    }
  }

  const { data: memories, error } = await queryBuilder;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ memories }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function writeMemory(supabase: any, userId: string, tenantId: string, entry: MemoryEntry) {
  // Learning is mandatory - auto-ensure consent exists
  await supabase
    .from('ai_user_consent')
    .upsert({
      tenant_id: tenantId,
      user_id: userId,
      site_opt_in: true,
      policy_version: 'v1',
      consented_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id,user_id' });

    const memoryData = {
      user_id: userId,
      tenant_id: entry.tenant_id || tenantId,
      type: entry.type,
      key: entry.key,
      value: entry.value,
      confidence: entry.confidence || 0.8,
      source: entry.source || 'chat',
      scope: 'user',
      tags: entry.tags || [],
      expires_at: entry.expires_at || null,
    };

  // Generate embedding for the value
  const valueText = typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value);
  const embedding = await generateEmbeddingVector(valueText);
  const memoryDataWithEmbedding: any = memoryData;
  if (embedding) {
    memoryDataWithEmbedding.embedding = embedding;
  }

  // IDEMPOTENT UPSERT with ON CONFLICT
  const { data, error } = await supabase
    .from('ai_user_memory')
    .upsert(memoryDataWithEmbedding, { 
      onConflict: 'tenant_id,user_id,key',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // AUDIT RECEIPT: Log memory commit
  try {
    await supabase.from('admin_audit_log').insert({
      action: 'memory.commit',
      actor_user_id: userId,
      metadata: {
        key: entry.key,
        type: entry.type,
        confidence: data.confidence,
        source: entry.source,
      }
    });
  } catch (auditErr) {
    // Silently fail audit logging
  }

  return new Response(JSON.stringify({ memory: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deleteMemory(supabase: any, userId: string, memoryId: string) {
  const { error } = await supabase
    .from('ai_user_memory')
    .delete()
    .eq('id', memoryId)
    .eq('user_id', userId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function searchEntities(supabase: any, params: any) {
  const { query, type, limit = 20 } = params;

  let queryBuilder = supabase
    .from('entity_profiles')
    .select('*')
    .limit(limit);

  if (type) {
    queryBuilder = queryBuilder.eq('entity_type', type);
  }

  if (query) {
    queryBuilder = queryBuilder.textSearch('search_vector', query);
  }

  const { data: entities, error } = await queryBuilder;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ entities }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateEmbedding(text: string) {
  const embedding = await generateEmbeddingVector(text);
  
  return new Response(JSON.stringify({ embedding }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateEmbeddingVector(text: string): Promise<number[] | null> {
  try {
    const vectors = await ai.embed('knower', [text]);
    return vectors[0] || null;
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return null;
  }
}
