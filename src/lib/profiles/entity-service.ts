/**
 * Entity Profile Service (Supabase)
 * 
 * Polymorphic entity system: profiles, horses, businesses, etc.
 * Supports partitioning, HNSW search, and claim flow.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type EntityType = Database['public']['Enums']['entity_type'];
type EntityProfile = Database['public']['Tables']['entity_profiles']['Row'];
type EntityProfileInsert = Database['public']['Tables']['entity_profiles']['Insert'];
type EntityProfileUpdate = Database['public']['Tables']['entity_profiles']['Update'];

export interface CreateEntityInput {
  entity_type: EntityType;
  slug: string;
  name: string;
  description?: string;
  custom_fields?: Record<string, any>;
}

export interface ClaimResult {
  success: boolean;
  error?: string;
  message?: string;
  id?: string;
  claimed_by?: string;
  claimed_at?: string;
}

class EntityProfileService {
  /**
   * Get entity by ID
   */
  async getById(id: string): Promise<EntityProfile | null> {
    const { data, error } = await supabase
      .from('entity_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[EntityProfileService] getById error:', error);
      return null;
    }

    return data;
  }

  /**
   * List entities with filters
   */
  async list(options?: {
    entity_type?: EntityType;
    owner_id?: string;
    is_claimed?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<EntityProfile[]> {
    let query = supabase
      .from('entity_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.entity_type) {
      query = query.eq('entity_type', options.entity_type);
    }

    if (options?.owner_id) {
      query = query.eq('owner_id', options.owner_id);
    }

    if (options?.is_claimed !== undefined) {
      query = query.eq('is_claimed', options.is_claimed);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[EntityProfileService] list error:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Create entity
   */
  async create(input: CreateEntityInput): Promise<EntityProfile | null> {
    // Get current user's profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('[EntityProfileService] No authenticated user');
      return null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      console.error('[EntityProfileService] No profile found for user');
      return null;
    }

    const insertData: EntityProfileInsert = {
      entity_type: input.entity_type,
      slug: input.slug,
      name: input.name,
      description: input.description,
      owner_id: profile.id,
      custom_fields: input.custom_fields || {},
    };

    const { data, error } = await supabase
      .from('entity_profiles')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[EntityProfileService] create error:', error);
      return null;
    }

    return data;
  }

  /**
   * Update entity
   */
  async update(id: string, updates: Partial<CreateEntityInput>): Promise<EntityProfile | null> {
    const updateData: EntityProfileUpdate = {
      ...(updates.name && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.custom_fields && { custom_fields: updates.custom_fields }),
    };

    const { data, error } = await supabase
      .from('entity_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[EntityProfileService] update error:', error);
      return null;
    }

    return data;
  }

  /**
   * Delete entity
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('entity_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[EntityProfileService] delete error:', error);
      return false;
    }

    return true;
  }

  /**
   * Check if entity can be claimed
   */
  async canClaim(entityId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('can_claim_entity', {
      entity_id: entityId,
    });

    if (error) {
      console.error('[EntityProfileService] canClaim error:', error);
      return false;
    }

    return data || false;
  }

  /**
   * Claim entity (atomic)
   */
  async claim(entityId: string): Promise<ClaimResult> {
    const { data, error } = await supabase.rpc('claim_entity', {
      entity_id: entityId,
    });

    if (error) {
      console.error('[EntityProfileService] claim error:', error);
      return {
        success: false,
        error: 'rpc_error',
        message: error.message,
      };
    }

    return (data || { success: false }) as unknown as ClaimResult;
  }

  /**
   * Search entities (full-text + trigram)
   */
  async search(searchTerm: string, options?: {
    entity_type?: EntityType;
    limit?: number;
  }): Promise<EntityProfile[]> {
    // Use textSearch for tsvector search
    let query = supabase
      .from('entity_profiles')
      .select('*')
      .textSearch('search_vector', searchTerm, {
        type: 'websearch',
        config: 'english',
      })
      .order('created_at', { ascending: false });

    if (options?.entity_type) {
      query = query.eq('entity_type', options.entity_type);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[EntityProfileService] search error:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Subscribe to entity changes (realtime)
   */
  subscribeToEntity(entityId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`entity-${entityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entity_profiles',
          filter: `id=eq.${entityId}`,
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const entityProfileService = new EntityProfileService();
