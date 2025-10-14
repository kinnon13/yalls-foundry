/**
 * Business Service (Supabase)
 * 
 * CRUD operations for businesses table with RLS staff access via is_biz_member()
 */

import { supabase } from '@/integrations/supabase/client';
import type { Business, CreateBusinessInputType, UpdateBusinessInputType } from '@/entities/business';
import { handleDbError } from '@/lib/utils/db';

class BusinessService {
  /**
   * Get business by ID
   */
  async getById(id: string): Promise<Business | null> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Business | null;
    } catch (error) {
      handleDbError(error);
    }
  }

  /**
   * Get business by slug
   */
  async getBySlug(slug: string): Promise<Business | null> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data as Business | null;
    } catch (error) {
      handleDbError(error);
    }
  }

  /**
   * List businesses with optional filters
   */
  async list(options?: {
    capability?: string;
    limit?: number;
  }): Promise<Business[]> {
    try {
      let query = supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.capability) {
        query = query.contains('capabilities', [options.capability]);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Business[];
    } catch (error) {
      handleDbError(error);
    }
  }

  /**
   * Create new business (owner = current user)
   */
  async create(input: CreateBusinessInputType, userId: string): Promise<Business> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          slug: input.slug,
          name: input.name,
          description: input.description || null,
          capabilities: input.capabilities,
          owner_id: userId,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Business;
    } catch (error) {
      handleDbError(error);
    }
  }

  /**
   * Update business (RLS: owner or staff with 'staff' role)
   */
  async update(id: string, updates: UpdateBusinessInputType): Promise<Business> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .update({
          name: updates.name,
          description: updates.description,
          capabilities: updates.capabilities,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Business;
    } catch (error) {
      handleDbError(error);
    }
  }

  /**
   * Delete business (RLS: owner or admin)
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete business error:', error);
      return false;
    }
  }

  /**
   * Check if user is member of business (RPC call to is_biz_member)
   */
  async isMember(businessId: string, userId: string, minRole: 'viewer' | 'staff' | 'admin' = 'viewer'): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_biz_member', {
        _business_id: businessId,
        _user_id: userId,
        _min_role: minRole,
      });

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('isMember check error:', error);
      return false;
    }
  }

  /**
   * Check if business needs KYC (Stripe verification)
   */
  async needsKyc(businessId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('needs_kyc', {
        _business_id: businessId,
      });

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('needsKyc check error:', error);
      return true; // Default to true for safety
    }
  }

  /**
   * Subscribe to business changes (realtime)
   */
  subscribeToChanges(
    businessId: string,
    callback: (payload: { eventType: string; new: Business; old: Business }) => void
  ): () => void {
    const channel = supabase
      .channel(`business-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'businesses',
          filter: `id=eq.${businessId}`,
        },
        (payload: any) => {
          callback({
            eventType: payload.eventType,
            new: payload.new as Business,
            old: payload.old as Business,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const businessService = new BusinessService();
