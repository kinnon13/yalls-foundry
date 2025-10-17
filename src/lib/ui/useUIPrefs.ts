/**
 * UI Preferences Hook (<200 LOC)
 * Load/save user or entity appearance prefs
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type UIPrefs = {
  theme: 'light' | 'dark' | 'system';
  density: 'compact' | 'comfortable' | 'spacious';
  accentColor: string;
  headerStyle: 'default' | 'minimal' | 'bold';
  linkStyle: 'cards' | 'list' | 'grid';
  coverLayout: 'banner' | 'hero' | 'minimal';
};

const defaultPrefs: UIPrefs = {
  theme: 'system',
  density: 'comfortable',
  accentColor: 'blue',
  headerStyle: 'default',
  linkStyle: 'cards',
  coverLayout: 'banner',
};

export function useUserUIPrefs() {
  const queryClient = useQueryClient();

  const { data: prefs } = useQuery({
    queryKey: ['user-ui-prefs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return defaultPrefs;

      const { data, error } = await supabase
        .from('user_ui_prefs')
        .select('prefs')
        .eq('user_id', user.id)
        .maybeSingle();

      return data?.prefs || defaultPrefs;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (newPrefs: Partial<UIPrefs>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const merged = { ...defaultPrefs, ...(prefs as UIPrefs), ...newPrefs };

      const { error } = await supabase
        .from('user_ui_prefs')
        .upsert({ user_id: user.id, prefs: merged });

      if (error) throw error;

      // Log to Rocker
      await supabase.rpc('rocker_log_action', {
        p_user_id: user.id,
        p_agent: 'user',
        p_action: 'ui_prefs_update',
        p_input: newPrefs,
        p_output: { success: true },
        p_result: 'success'
      });

      return merged;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-ui-prefs'] });
    }
  });

  return {
    prefs: prefs || defaultPrefs,
    savePrefs: saveMutation.mutate,
    isLoading: saveMutation.isPending
  };
}

export function useEntityUIPrefs(entityId?: string) {
  const queryClient = useQueryClient();

  const { data: prefs } = useQuery({
    queryKey: ['entity-ui-prefs', entityId],
    queryFn: async () => {
      if (!entityId) return defaultPrefs;

      const { data, error } = await supabase
        .from('entity_ui_prefs')
        .select('prefs')
        .eq('entity_id', entityId)
        .maybeSingle();

      return data?.prefs || defaultPrefs;
    },
    enabled: !!entityId
  });

  const saveMutation = useMutation({
    mutationFn: async (newPrefs: Partial<UIPrefs>) => {
      if (!entityId) throw new Error('No entity ID');

      const merged = { ...defaultPrefs, ...(prefs as UIPrefs), ...newPrefs };

      const { error } = await supabase
        .from('entity_ui_prefs')
        .upsert({ entity_id: entityId, prefs: merged });

      if (error) throw error;
      return merged;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-ui-prefs', entityId] });
    }
  });

  return {
    prefs: prefs || defaultPrefs,
    savePrefs: saveMutation.mutate,
    isLoading: saveMutation.isPending
  };
}
