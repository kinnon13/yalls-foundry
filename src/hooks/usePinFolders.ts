/**
 * usePinFolders Hook
 * Manages pin folders organization
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PinSection = 'home' | 'apps' | 'horses' | 'businesses' | 'people' | 'custom';

export interface PinFolder {
  id: string;
  user_id: string;
  section: PinSection;
  title: string;
  icon?: string;
  color?: string;
  sort_index: number;
  parent_folder_id?: string | null;
  created_at: string;
}

export function usePinFolders(userId: string | null, section: PinSection) {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ['pinFolders', userId, section],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_pin_folders')
        .select('*')
        .eq('user_id', userId)
        .eq('section', section)
        .order('sort_index', { ascending: true });

      return (data || []) as PinFolder[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: {
      title: string;
      icon?: string;
      color?: string;
      parent_folder_id?: string | null;
    }) => {
      if (!userId) throw new Error('Not signed in');
      
      const { error } = await supabase.from('user_pin_folders').insert([
        {
          user_id: userId,
          section,
          ...input,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinFolders', userId, section] });
    },
  });

  const rename = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase
        .from('user_pin_folders')
        .update({ title })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinFolders', userId, section] });
    },
  });

  const reorder = useMutation({
    mutationFn: async (updates: Array<{ id: string; sort_index: number }>) => {
      const promises = updates.map(({ id, sort_index }) =>
        supabase.from('user_pin_folders').update({ sort_index }).eq('id', id)
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinFolders', userId, section] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_pin_folders').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinFolders', userId, section] });
      queryClient.invalidateQueries({ queryKey: ['pins', userId, section] });
    },
  });

  return {
    ...list,
    create,
    rename,
    reorder,
    remove,
  };
}

export function useSectionPins(
  userId: string | null,
  section: PinSection,
  folderId?: string | null
) {
  return useQuery({
    queryKey: ['pins', userId, section, folderId],
    enabled: !!userId,
    queryFn: async () => {
      let query = supabase
        .from('user_pins')
        .select('*')
        .eq('user_id', userId)
        .eq('section', section)
        .order('sort_index', { ascending: true });

      if (folderId) {
        query = query.eq('folder_id', folderId);
      } else {
        query = query.is('folder_id', null);
      }

      const { data } = await query;
      return data || [];
    },
  });
}
