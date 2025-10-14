/**
 * Entity Profile Service
 * 
 * Real Supabase CRUD for entity_profiles table (billion-scale ready).
 * Handles claim flow, realtime updates, and vector search.
 */

import { supabase } from '@/integrations/supabase/client';
import type { BaseProfile, ProfileType, CreateProfileInput, UpdateProfileInput } from '@/entities/profile';
import { handleDbError } from '@/lib/utils/db';

export class EntityProfileService {
  /**
   * Get entity profile by ID
   */
  async getById(id: string): Promise<BaseProfile | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('entity_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as BaseProfile;
    } catch (error) {
      handleDbError(error);
    }
  }

  /**
   * List entity profiles with optional filters
   */
  async list(options?: {
    type?: ProfileType;
    claimed?: boolean;
    tenant_id?: string;
    limit?: number;
  }): Promise<BaseProfile[]> {
    try {
      let query = (supabase as any)
        .from('entity_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.type) {
        query = query.eq('type', options.type);
      }

      if (options?.claimed !== undefined) {
        query = query.eq('is_claimed', options.claimed);
      }

      if (options?.tenant_id) {
        query = query.eq('tenant_id', options.tenant_id);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as BaseProfile[]) || [];
    } catch (error) {
      handleDbError(error);
    }
  }

  /**
   * Create new entity profile
   */
  async create(input: CreateProfileInput): Promise<BaseProfile> {
    try {
      const { data, error } = await (supabase as any)
        .from('entity_profiles')
        .insert({
          type: input.type,
          name: input.name,
          custom_fields: input.custom_fields || {},
          claimed_by: input.claimed_by || null,
          tenant_id: input.tenant_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BaseProfile;
    } catch (error) {
      handleDbError(error);
    }
  }

  /**
   * Update entity profile
   */
  async update(id: string, updates: Partial<UpdateProfileInput>): Promise<BaseProfile> {
    try {
      const { data, error } = await (supabase as any)
        .from('entity_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BaseProfile;
    } catch (error) {
      handleDbError(error);
    }
  }

  /**
   * Claim entity profile (real implementation)
   */
  async claim(profileId: string, userId: string): Promise<BaseProfile> {
    try {
      // Check if user has permission to claim
      const canClaim = await this.canClaim(userId);
      if (!canClaim) {
        throw new Error('User does not have permission to claim profiles');
      }

      // Update profile to mark as claimed
      const { data, error } = await (supabase as any)
        .from('entity_profiles')
        .update({
          is_claimed: true,
          claimed_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId)
        .eq('is_claimed', false) // Only claim if not already claimed
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Profile is already claimed or not found');

      return data as BaseProfile;
    } catch (error) {
      handleDbError(error);
    }
  }

  /**
   * Check if user can claim profiles
   */
  async canClaim(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'business_owner',
      });

      if (error) {
        console.error('canClaim check error:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('canClaim error:', error);
      return false;
    }
  }

  /**
   * Delete entity profile (soft delete by setting claimed_by to null)
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('entity_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  /**
   * Search entities by keyword
   */
  async search(query: string, type?: ProfileType, limit = 20): Promise<BaseProfile[]> {
    try {
      const { data, error } = await (supabase as any).rpc('search_entities', {
        query_text: query,
        entity_type: type || null,
        similarity_threshold: 0.7,
        max_results: limit,
      });

      if (error) throw error;
      return (data as BaseProfile[]) || [];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Subscribe to realtime updates for entity profiles
   */
  subscribeToChanges(
    callback: (payload: { eventType: string; new: BaseProfile; old: BaseProfile }) => void
  ): () => void {
    const channel = supabase
      .channel('entity_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entity_profiles',
        },
        (payload: any) => callback(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const entityProfileService = new EntityProfileService();
