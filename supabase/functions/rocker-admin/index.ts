import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GlobalKnowledgeEntry {
  tenant_id: string;
  type: 'preference' | 'fact' | 'goal' | 'note' | 'policy' | 'schema';
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

  const limited = await withRateLimit(req, 'rocker-admin', RateLimits.admin);
  if (limited) return limited;

  const log = createLogger('rocker-admin');
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

    // Check if user is admin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, ...params } = await req.json();
    const authHeader = req.headers.get('Authorization') || '';

    switch (action) {
      // Andy/Super Admin actions
      case 'list_users':
        return await listUsers(supabaseClient);
      
      case 'view_profile':
        return await viewProfile(supabaseClient, params.user_id);
      
      case 'view_conversations':
        return await viewConversations(supabaseClient, params.user_id);
      
      case 'view_memories':
        return await viewMemories(supabaseClient, params.user_id);
      
      case 'get_analytics':
        return await getAnalytics(supabaseClient, params.user_id);
      
      case 'update_privacy':
        return await updatePrivacy(supabaseClient, params.user_id, params.privacy_settings);
      
      // Original rocker-admin actions
      case 'search_global_knowledge':
        return await searchGlobalKnowledge(supabaseClient, params, authHeader);
      
      case 'write_global_knowledge':
        return await writeGlobalKnowledge(supabaseClient, user.id, params.entry, authHeader);
      
      case 'delete_global_knowledge':
        return await deleteGlobalKnowledge(supabaseClient, params.id);
      
      case 'search_users':
        return await searchUsers(supabaseClient, params);
      
      case 'merge_entities':
        return await mergeEntities(supabaseClient, user.id, params);
      
      case 'verify_result':
        return await verifyResult(supabaseClient, user.id, params);
      
      case 'audit_log':
        return await auditLog(supabaseClient, user.id, params);
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    log.error('Error in rocker-admin', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function searchGlobalKnowledge(supabase: any, params: any, authHeader: string) {
  const { query, tenant_id, limit = 20, tags } = params;

  let queryBuilder = supabase
    .from('ai_global_knowledge')
    .select('*')
    .or('expires_at.is.null,expires_at.gt.now()')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (tenant_id) {
    queryBuilder = queryBuilder.eq('tenant_id', tenant_id);
  }

  if (tags && tags.length > 0) {
    queryBuilder = queryBuilder.contains('tags', tags);
  }

  if (query) {
    const embedding = await generateEmbeddingVector(query, supabase, authHeader);
    if (embedding) {
      queryBuilder = queryBuilder.order('embedding <-> ' + JSON.stringify(embedding));
    }
  }

  const { data: knowledge, error } = await queryBuilder;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ knowledge }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function writeGlobalKnowledge(supabase: any, userId: string, entry: GlobalKnowledgeEntry, authHeader: string) {
  const knowledgeData = {
    tenant_id: entry.tenant_id,
    type: entry.type,
    key: entry.key,
    value: entry.value,
    confidence: entry.confidence || 0.9,
    source: entry.source || 'admin',
    tags: entry.tags || [],
    expires_at: entry.expires_at || null,
    created_by: userId,
  };

  const valueText = typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value);
  const embedding = await generateEmbeddingVector(valueText, supabase, '');
  const knowledgeDataWithEmbedding: any = knowledgeData;
  if (embedding) {
    knowledgeDataWithEmbedding.embedding = embedding;
  }

  const { data, error } = await supabase
    .from('ai_global_knowledge')
    .upsert(knowledgeDataWithEmbedding, { onConflict: 'tenant_id,key' })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Log the action
  await auditLogInternal(supabase, userId, 'write_global_knowledge', 'global', [data.id], {
    key: entry.key,
    type: entry.type,
  });

  return new Response(JSON.stringify({ knowledge: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deleteGlobalKnowledge(supabase: any, knowledgeId: string) {
  const { error } = await supabase
    .from('ai_global_knowledge')
    .delete()
    .eq('id', knowledgeId);

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

async function searchUsers(supabase: any, params: any) {
  const { query, limit = 50 } = params;

  let queryBuilder = supabase
    .from('profiles')
    .select('*')
    .limit(limit);

  if (query) {
    queryBuilder = queryBuilder.or(`display_name.ilike.%${query}%,bio.ilike.%${query}%`);
  }

  const { data: users, error } = await queryBuilder;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ users }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function mergeEntities(supabase: any, userId: string, params: any) {
  const { primary_id, duplicate_id } = params;

  // This is a complex operation that would need careful implementation
  // For now, just log the action
  await auditLogInternal(supabase, userId, 'merge_entities', 'entity', [primary_id, duplicate_id], {
    action: 'merge_requested',
  });

  return new Response(JSON.stringify({ 
    success: true,
    message: 'Merge request logged for manual processing'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function verifyResult(supabase: any, userId: string, params: any) {
  const { result_id, status, reason } = params;

  // Log verification action
  await auditLogInternal(supabase, userId, 'verify_result', 'event_result', [result_id], {
    status,
    reason,
  });

  return new Response(JSON.stringify({ 
    success: true,
    message: 'Result verification logged'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function auditLog(supabase: any, userId: string, params: any) {
  const { action, scope, target_ids, metadata } = params;
  
  return await auditLogInternal(supabase, userId, action, scope, target_ids, metadata);
}

async function auditLogInternal(
  supabase: any, 
  actorId: string, 
  action: string, 
  scope: string, 
  targetIds: string[], 
  metadata: any
) {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .insert({
      actor_user_id: actorId,
      action: action,
      metadata: {
        scope,
        target_ids: targetIds,
        ...metadata,
      },
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ audit_log: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Andy/Super Admin Functions
async function listUsers(supabase: any) {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, bio, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const userIds = profiles?.map(p => p.user_id) || [];
  const { data: memoryCounts } = await supabase
    .from('ai_user_memory')
    .select('user_id')
    .in('user_id', userIds);

  const counts = (memoryCounts || []).reduce((acc: any, m: any) => {
    acc[m.user_id] = (acc[m.user_id] || 0) + 1;
    return acc;
  }, {});

  const { data: privacySettings } = await supabase
    .from('ai_user_privacy')
    .select('*')
    .in('user_id', userIds);

  const privacyMap = (privacySettings || []).reduce((acc: any, p: any) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  const enriched = profiles?.map(p => ({
    ...p,
    memory_count: counts[p.user_id] || 0,
    privacy: privacyMap[p.user_id] || null,
  }));

  return new Response(JSON.stringify({ users: enriched }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function viewProfile(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return new Response(JSON.stringify({ profile }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function viewConversations(supabase: any, userId: string) {
  const { data: sessions } = await supabase
    .from('ai_sessions')
    .select('id, actor_role, started_at, ended_at, params')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(50);

  const sessionIds = sessions?.map(s => s.id).slice(0, 10) || [];
  const { data: messages } = await supabase.functions.invoke('chat-store', {
    body: { action: 'get_sessions', session_ids: sessionIds },
  });

  return new Response(JSON.stringify({ sessions, messages: messages?.data || [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function viewMemories(supabase: any, userId: string) {
  const { data: memories } = await supabase
    .from('ai_user_memory')
    .select('id, type, key, value, confidence, source, created_at, use_count, pinned')
    .eq('user_id', userId)
    .order('pinned', { ascending: false })
    .order('use_count', { ascending: false })
    .limit(200);

  const grouped = (memories || []).reduce((acc: any, m: any) => {
    const type = m.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(m);
    return acc;
  }, {});

  return new Response(JSON.stringify({ memories: grouped }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getAnalytics(supabase: any, userId: string) {
  const { data: analytics } = await supabase
    .from('ai_user_analytics')
    .select('*')
    .eq('user_id', userId)
    .order('calculated_at', { ascending: false })
    .limit(50);

  return new Response(JSON.stringify({ analytics }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updatePrivacy(supabase: any, userId: string, settings: any) {
  const { error } = await supabase
    .from('ai_user_privacy')
    .upsert({
      user_id: userId,
      ...settings,
      managed_by_super_admin: true,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

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

async function generateEmbeddingVector(text: string, supabase: any, authHeader: string): Promise<number[] | null> {
  try {
    const { ai } = await import("../_shared/ai.ts");
    const vectors = await ai.embed('admin', [text]);
    return vectors[0] || null;
  } catch {
    return null;
  }
}
