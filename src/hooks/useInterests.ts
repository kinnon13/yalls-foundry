/**
 * Universal Interests Hook
 * Provides utilities for interest management across the app
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InterestCatalogItem {
  id: string;
  domain: string;
  category: string;
  tag: string;
  locale: string;
  is_active: boolean;
  sort_order: number;
}

export interface UserInterest {
  interest_id: string;
  affinity: number;
  confidence: 'explicit' | 'inferred';
  source: string;
  interest_catalog?: InterestCatalogItem;
}

export function useInterests() {
  const [userInterests, setUserInterests] = useState<UserInterest[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadUserInterests = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_interests')
        .select('*, interest_catalog(*)')
        .eq('user_id', user.id)
        .order('affinity', { ascending: false });

      if (error) throw error;
      
      setUserInterests((data as any) || []);
    } catch (err) {
      console.error('[useInterests] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addInterest = async (interestId: string, affinity: number = 0.8, source: string = 'manual') => {
    try {
      const { error } = await supabase.rpc('user_interests_upsert', {
        p_items: JSON.stringify([{
          interest_id: interestId,
          affinity,
          confidence: 'explicit',
          source
        }])
      });

      if (error) throw error;

      // Emit signal
      await (supabase as any).rpc('emit_signal', {
        p_name: 'interest_selected',
        p_metadata: { interest_id: interestId }
      });

      await loadUserInterests();

      toast({
        title: 'Interest added',
        description: 'Your preferences have been updated'
      });
    } catch (err) {
      console.error('[useInterests] Add error:', err);
      toast({
        title: 'Error',
        description: 'Failed to add interest',
        variant: 'destructive'
      });
    }
  };

  const removeInterest = async (interestId: string) => {
    try {
      const { error } = await supabase.rpc('user_interests_remove', {
        p_interest_id: interestId
      });

      if (error) throw error;

      await loadUserInterests();

      toast({
        title: 'Interest removed',
        description: 'Your preferences have been updated'
      });
    } catch (err) {
      console.error('[useInterests] Remove error:', err);
      toast({
        title: 'Error',
        description: 'Failed to remove interest',
        variant: 'destructive'
      });
    }
  };

  const searchCatalog = async (query: string, limit: number = 25): Promise<InterestCatalogItem[]> => {
    try {
      const { data, error } = await supabase.rpc('interest_catalog_search', {
        p_q: query,
        p_locale: 'en-US',
        p_limit: limit
      });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[useInterests] Search error:', err);
      return [];
    }
  };

  const browseCatalog = async (domain?: string): Promise<InterestCatalogItem[]> => {
    try {
      const { data, error } = await supabase.rpc('interest_catalog_browse', {
        p_domain: domain || null,
        p_locale: 'en-US',
        p_limit: 100
      });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[useInterests] Browse error:', err);
      return [];
    }
  };

  useEffect(() => {
    loadUserInterests();
  }, []);

  return {
    userInterests,
    loading,
    addInterest,
    removeInterest,
    searchCatalog,
    browseCatalog,
    reload: loadUserInterests
  };
}
