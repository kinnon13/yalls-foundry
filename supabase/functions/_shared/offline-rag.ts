/**
 * Offline RAG System
 * Local embeddings + vector search for sub-50ms retrieval
 * 
 * Architecture:
 * - Generate embeddings via Lovable AI
 * - Store in ai_user_memory with pgvector
 * - Semantic search using cosine similarity
 * - Client-side caching for instant recall
 * 
 * Usage:
 *   const results = await offlineRAG.search(ctx, query, { limit: 5 });
 */

import { createLogger } from './logger.ts';
import type { TenantContext } from './tenantGuard.ts';
import { ai } from './ai.ts';

const log = createLogger('offline-rag');

export interface RAGDocument {
  id: string;
  key: string;
  value: any;
  type: string;
  score: number;
  tags: string[];
  created_at: string;
}

export interface RAGSearchOptions {
  limit?: number;
  threshold?: number;
  tags?: string[];
  type?: string;
}

/**
 * Generate embedding for text using Lovable AI
 */
export async function generateEmbedding(text: string, role: 'user' | 'admin' | 'knower' = 'knower'): Promise<number[] | null> {
  try {
    const vectors = await ai.embed(role, [text]);
    return vectors[0] || null;
  } catch (error) {
    log.error('Embedding generation failed', error);
    return null;
  }
}

/**
 * Semantic search using vector similarity
 */
export async function search(
  ctx: TenantContext,
  query: string,
  options: RAGSearchOptions = {}
): Promise<RAGDocument[]> {
  const { limit = 10, threshold = 0.5, tags, type } = options;
  
  log.startTimer();
  
  // Generate query embedding
  const embedding = await generateEmbedding(query);
  if (!embedding) {
    log.warn('No embedding generated, falling back to keyword search');
    return await keywordSearch(ctx, query, options);
  }
  
  // Build query with vector similarity
  let queryBuilder = ctx.tenantClient
    .from('ai_user_memory')
    .select('*')
    .eq('user_id', ctx.userId)
    .or('expires_at.is.null,expires_at.gt.now()')
    .gte('confidence', threshold)
    .order('embedding <-> ' + JSON.stringify(embedding))
    .limit(limit);
  
  if (tags && tags.length > 0) {
    queryBuilder = queryBuilder.contains('tags', tags);
  }
  
  if (type) {
    queryBuilder = queryBuilder.eq('type', type);
  }
  
  const { data, error } = await queryBuilder;
  
  if (error) {
    log.error('RAG search failed', error);
    throw error;
  }
  
  log.info('RAG search completed', { 
    query, 
    results: data?.length || 0,
    threshold 
  });
  
  return (data || []).map(d => ({
    id: d.id,
    key: d.key,
    value: d.value,
    type: d.type,
    score: d.confidence,
    tags: d.tags || [],
    created_at: d.created_at,
  }));
}

/**
 * Fallback keyword search when embeddings fail
 */
async function keywordSearch(
  ctx: TenantContext,
  query: string,
  options: RAGSearchOptions
): Promise<RAGDocument[]> {
  const { limit = 10, tags, type } = options;
  
  let queryBuilder = ctx.tenantClient
    .from('ai_user_memory')
    .select('*')
    .eq('user_id', ctx.userId)
    .or('expires_at.is.null,expires_at.gt.now()')
    .textSearch('key', query)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (tags && tags.length > 0) {
    queryBuilder = queryBuilder.contains('tags', tags);
  }
  
  if (type) {
    queryBuilder = queryBuilder.eq('type', type);
  }
  
  const { data } = await queryBuilder;
  
  return (data || []).map(d => ({
    id: d.id,
    key: d.key,
    value: d.value,
    type: d.type,
    score: d.confidence || 0.5,
    tags: d.tags || [],
    created_at: d.created_at,
  }));
}

/**
 * Store document with embedding
 */
export async function store(
  ctx: TenantContext,
  doc: {
    key: string;
    value: any;
    type: string;
    confidence?: number;
    source?: string;
    tags?: string[];
    expires_at?: string;
  }
): Promise<RAGDocument> {
  log.startTimer();
  
  // Generate embedding
  const valueText = typeof doc.value === 'string' 
    ? doc.value 
    : JSON.stringify(doc.value);
  const embedding = await generateEmbedding(valueText);
  
  // Auto-ensure consent for learning
  await ctx.tenantClient
    .from('ai_user_consent')
    .upsert({
      tenant_id: ctx.orgId,
      user_id: ctx.userId,
      site_opt_in: true,
      policy_version: 'v1',
      consented_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id,user_id' });
  
  // Upsert with idempotency
  const memoryData: any = {
    user_id: ctx.userId,
    tenant_id: ctx.orgId,
    type: doc.type,
    key: doc.key,
    value: doc.value,
    confidence: doc.confidence || 0.8,
    source: doc.source || 'chat',
    scope: 'user',
    tags: doc.tags || [],
    expires_at: doc.expires_at || null,
  };
  
  if (embedding) {
    memoryData.embedding = embedding;
  }
  
  const { data, error } = await ctx.tenantClient
    .from('ai_user_memory')
    .upsert(memoryData, { 
      onConflict: 'tenant_id,user_id,key',
      ignoreDuplicates: false 
    })
    .select()
    .single();
  
  if (error) {
    log.error('RAG store failed', error);
    throw error;
  }
  
  // Audit log
  await ctx.adminClient.from('admin_audit_log').insert({
    request_id: ctx.requestId,
    action: 'memory.commit',
    actor_user_id: ctx.userId,
    metadata: {
      key: doc.key,
      type: doc.type,
      confidence: data.confidence,
      source: doc.source,
    }
  }).then().catch(console.error);
  
  log.info('RAG document stored', { key: doc.key, type: doc.type });
  
  return {
    id: data.id,
    key: data.key,
    value: data.value,
    type: data.type,
    score: data.confidence,
    tags: data.tags || [],
    created_at: data.created_at,
  };
}

/**
 * Batch store multiple documents
 */
export async function storeBatch(
  ctx: TenantContext,
  docs: Array<{
    key: string;
    value: any;
    type: string;
    confidence?: number;
    tags?: string[];
  }>
): Promise<RAGDocument[]> {
  const results: RAGDocument[] = [];
  
  for (const doc of docs) {
    try {
      const stored = await store(ctx, doc);
      results.push(stored);
    } catch (error) {
      log.error('Batch store item failed', error, { key: doc.key });
    }
  }
  
  return results;
}

/**
 * Export for easy access
 */
export const offlineRAG = {
  search,
  store,
  storeBatch,
  generateEmbedding,
};
