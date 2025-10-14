/**
 * Supabase Profile Service
 * 
 * NOTE: Current DB schema mismatch - profiles table is for user profiles,
 * not entity profiles (horse/farm/business). This service provides a bridge
 * until schema is migrated to unified polymorphic design.
 * 
 * TODO: Create entity_profiles table with type discriminator + JSONB custom_fields
 */

import { supabase } from '@/integrations/supabase/client';
import type { AnyProfile, ProfileType } from './types';
import { handleDbError } from '@/lib/utils/db';

/**
 * Bridge type for current DB schema
 */
type DbProfile = {
  id: string;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

class SupabaseProfileService {
  /**
   * Convert DB profile to AnyProfile (temporary bridge)
   */
  private toAnyProfile(dbProfile: DbProfile, type: ProfileType = 'rider'): AnyProfile {
    const base = {
      id: dbProfile.id,
      name: dbProfile.display_name || 'Unnamed',
      type,
      is_claimed: true, // Current profiles table only has claimed profiles
      claimed_by: dbProfile.user_id,
      created_at: dbProfile.created_at,
      updated_at: dbProfile.updated_at,
    };

    // Return typed profile based on type
    switch (type) {
      case 'rider':
        return { ...base, type: 'rider' } as AnyProfile;
      case 'owner':
        return { ...base, type: 'owner' } as AnyProfile;
      case 'breeder':
        return { ...base, type: 'breeder' } as AnyProfile;
      default:
        return { ...base, type: 'rider' } as AnyProfile;
    }
  }

  /**
   * Get profile by ID
   * NOTE: Returns user profile, not entity profile
   */
  async getById(id: string): Promise<AnyProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return this.toAnyProfile(data as DbProfile);
    } catch (error) {
      handleDbError(error);
    }
  }

  /**
   * List profiles
   * NOTE: Current implementation returns user profiles only
   */
  async list(type?: ProfileType): Promise<AnyProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((p) => this.toAnyProfile(p as DbProfile, type || 'rider'));
    } catch (error) {
      handleDbError(error);
    }
  }

  /**
   * Create new profile
   * NOTE: Creates user profile with current schema
   */
  async create(profile: Partial<AnyProfile>): Promise<AnyProfile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: profile.claimed_by || '',
          display_name: profile.name || 'Unnamed',
          bio: '',
          avatar_url: null,
        })
        .select()
        .single();

      if (error) throw error;
      return this.toAnyProfile(data as DbProfile, profile.type);
    } catch (error) {
      handleDbError(error);
    }
  }

  /**
   * Update profile
   */
  async update(id: string, updates: Partial<AnyProfile>): Promise<AnyProfile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          display_name: updates.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.toAnyProfile(data as DbProfile, updates.type);
    } catch (error) {
      handleDbError(error);
    }
  }

  /**
   * Claim profile
   * NOTE: Current schema doesn't support claim flow - profiles are created per-user
   * This is a no-op until entity_profiles table exists
   */
  async claim(profileId: string, userId: string): Promise<AnyProfile> {
    // No-op: current profiles table doesn't have is_claimed/claimed_by columns
    const profile = await this.getById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }
    return profile;
  }

  /**
   * Delete profile
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete profile error:', error);
      return false;
    }
  }

  /**
   * Check if user can claim profile
   */
  async canClaim(profileId: string, userId: string): Promise<boolean> {
    try {
      const { data } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'business_owner',
      });

      return !!data;
    } catch (error) {
      console.error('canClaim check error:', error);
      return false;
    }
  }
}

export const supabaseProfileService = new SupabaseProfileService();
