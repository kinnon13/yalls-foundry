/**
 * Knowledge Base SDK
 * 
 * Client-side utilities for accessing Rocker's knowledge base
 */

import { supabase } from '@/integrations/supabase/client';

export interface KnowledgeItem {
  id: string;
  uri: string;
  scope: 'global' | 'site' | 'user';
  category: string;
  subcategory?: string;
  title: string;
  summary?: string;
  tags: string[];
  content_excerpt?: string;
  knowledge_chunks?: KnowledgeChunk[];
}

export interface KnowledgeChunk {
  id: string;
  idx: number;
  text: string;
  token_count?: number;
}

export interface Playbook {
  id: string;
  intent: string;
  scope: 'global' | 'site' | 'user';
  required_slots: Record<string, any>;
  steps: Array<{ action: string; description: string }>;
  ask_templates: string[];
  from_knowledge_uri?: string;
}

export interface SearchOptions {
  q: string;
  scope?: 'global' | 'site' | 'user';
  category?: string;
  subcategory?: string;
  tags?: string[];
  limit?: number;
  semantic?: boolean;
}

/**
 * Search knowledge base
 */
export async function searchKnowledge(options: SearchOptions) {
  const { data, error } = await supabase.functions.invoke('kb-search', {
    body: options,
  });

  if (error) {
    console.error('[KB SDK] Search error:', error);
    throw error;
  }

  return data;
}

/**
 * Get knowledge item by URI
 */
export async function getKnowledgeItem(uri: string): Promise<KnowledgeItem | null> {
  const { data, error } = await supabase.functions.invoke('kb-item', {
    body: { uri },
  });

  if (error) {
    console.error('[KB SDK] Get item error:', error);
    throw error;
  }

  return data?.item || null;
}

/**
 * Find related knowledge items
 */
export async function getRelatedKnowledge(uri: string, limit = 8) {
  const { data, error } = await supabase.functions.invoke('kb-related', {
    body: { uri, limit },
  });

  if (error) {
    console.error('[KB SDK] Related error:', error);
    throw error;
  }

  return data?.related || [];
}

/**
 * Get playbook by intent
 */
export async function getPlaybook(intent: string, scope?: string): Promise<Playbook | null> {
  const { data, error } = await supabase.functions.invoke('kb-playbook', {
    body: { intent, scope },
  });

  if (error) {
    console.error('[KB SDK] Playbook error:', error);
    throw error;
  }

  return data?.found ? data.playbook : null;
}

/**
 * Ingest knowledge from markdown content
 */
export async function ingestKnowledge(content: string, uri: string, tenantId?: string) {
  const { data, error } = await supabase.functions.invoke('kb-ingest', {
    body: {
      content,
      uri,
      tenant_id: tenantId,
    },
  });

  if (error) {
    console.error('[KB SDK] Ingest error:', error);
    throw error;
  }

  return data;
}

/**
 * Resolve term from dictionary
 */
export async function resolveTerm(term: string) {
  const { data, error } = await supabase
    .from('term_dictionary')
    .select('*')
    .or(`term.ilike.%${term}%,synonyms.cs.{${term}}`)
    .order('scope', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[KB SDK] Term resolve error:', error);
    return null;
  }

  return data;
}

/**
 * Get knowledge by category
 */
export async function getKnowledgeByCategory(
  category: string,
  subcategory?: string,
  scope: 'global' | 'site' | 'user' = 'global'
) {
  let query = supabase
    .from('knowledge_items')
    .select('id, uri, title, summary, tags, subcategory')
    .eq('scope', scope)
    .eq('category', category);

  if (subcategory) {
    query = query.eq('subcategory', subcategory);
  }

  const { data, error } = await query.order('title');

  if (error) {
    console.error('[KB SDK] Category error:', error);
    throw error;
  }

  return data || [];
}
