/**
 * Universal Interests Hook
 * Provides utilities for interest management across the app
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Interest {
  id: string;
  domain: string;
  category: string;
  tag: string;
}

interface UserInterest {
  interest_id: string;
  affinity: number;
  confidence: 'explicit' | 'inferred';
  source: string;
  interest: Interest;
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
      
      setUserInterests(data as any || []);
    } catch (err) {
      console.error('[useInterests] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addInterest = async (interestId: string, affinity: number = 0.8) => {
    try {
      const { error } = await supabase.rpc('user_interests_upsert', {
        p_items: [{
          interest_id: interestId,
          affinity,
          confidence: 'explicit',
          source: 'manual'
        }]
      });

      if (error) throw error;

      // Emit signal
      await supabase.rpc('emit_signal', {
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

  const searchCatalog = async (query: string, limit: number = 25) => {
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

  useEffect(() => {
    loadUserInterests();
  }, []);

  return {
    userInterests,
    loading,
    addInterest,
    removeInterest,
    searchCatalog,
    reload: loadUserInterests
  };
}
