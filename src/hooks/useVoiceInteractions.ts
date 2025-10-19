import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type VoiceInteraction = Database['public']['Tables']['voice_interactions']['Row'];

export function useVoiceInteractions() {
  const [interactions, setInteractions] = useState<VoiceInteraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInteractions();

    // Subscribe to new voice interactions
    const channel = supabase
      .channel('voice-interactions-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'voice_interactions',
        },
        (payload) => {
          setInteractions((prev) => [payload.new as VoiceInteraction, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadInteractions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('voice_interactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setInteractions(data || []);
    } catch (error) {
      console.error('Error loading voice interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    interactions,
    loading,
    refresh: loadInteractions,
  };
}
