/**
 * Hook for managing app pins with grid positions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AppPin {
  id: string;
  app_id: string;
  grid_x: number;
  grid_y: number;
  folder_id?: string | null;
  sort_index: number;
}

export interface AppFolder {
  id: string;
  title: string;
  icon?: string;
  color?: string;
  grid_x: number;
  grid_y: number;
  apps: AppPin[];
}

export function useAppPins(userId: string | null) {
  const queryClient = useQueryClient();

  const { data: pins = [], isLoading } = useQuery({
    queryKey: ['app-pins', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_pins')
        .select('*')
        .eq('user_id', userId)
        .eq('section', 'home')
        .eq('pin_type', 'app')
        .order('sort_index');

      if (error) throw error;
      
      // Map database response to AppPin type
      return (data || []).map(pin => ({
        id: pin.id,
        app_id: pin.ref_id,
        grid_x: (pin.metadata as any)?.grid_x ?? 0,
        grid_y: (pin.metadata as any)?.grid_y ?? 0,
        folder_id: pin.folder_id,
        sort_index: pin.sort_index,
      })) as AppPin[];
    },
    enabled: !!userId,
  });

  const { data: folders = [], isLoading: isLoadingFolders } = useQuery({
    queryKey: ['app-folders', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_pin_folders')
        .select('*')
        .eq('user_id', userId)
        .eq('section', 'home')
        .order('sort_index');

      if (error) throw error;
      
      // Get pins for each folder
      const foldersWithPins = await Promise.all((data || []).map(async (folder) => {
        const { data: folderPins } = await supabase
          .from('user_pins')
          .select('*')
          .eq('folder_id', folder.id)
          .order('sort_index');
          
        return {
          id: folder.id,
          title: folder.title,
          icon: folder.icon || undefined,
          color: folder.color || undefined,
          grid_x: 0, // Will be updated when positioning is implemented
          grid_y: 0,
          apps: (folderPins || []).map(pin => ({
            id: pin.id,
            app_id: pin.ref_id,
            grid_x: (pin.metadata as any)?.grid_x ?? 0,
            grid_y: (pin.metadata as any)?.grid_y ?? 0,
            folder_id: pin.folder_id,
            sort_index: pin.sort_index,
          })),
        } as AppFolder;
      }));
      
      return foldersWithPins;
    },
    enabled: !!userId,
  });

  const updatePosition = useMutation({
    mutationFn: async ({ pinId, x, y }: { pinId: string; x: number; y: number }) => {
      const { error } = await supabase
        .from('user_pins')
        .update({ 
          metadata: { grid_x: x, grid_y: y },
          updated_at: new Date().toISOString()
        })
        .eq('id', pinId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-pins', userId] });
    },
  });

  const pinApp = useMutation({
    mutationFn: async ({ 
      appId, 
      x, 
      y, 
      folderId 
    }: { 
      appId: string; 
      x: number; 
      y: number;
      folderId?: string;
    }) => {
      if (!userId) throw new Error('No user');

      const { error } = await supabase
        .from('user_pins')
        .insert({
          user_id: userId,
          section: 'home',
          pin_type: 'app',
          ref_id: appId,
          folder_id: folderId || null,
          metadata: { grid_x: x, grid_y: y },
          sort_index: pins.length,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-pins', userId] });
    },
  });

  const unpinApp = useMutation({
    mutationFn: async (pinId: string) => {
      const { error } = await supabase
        .from('user_pins')
        .delete()
        .eq('id', pinId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-pins', userId] });
    },
  });

  const createFolder = useMutation({
    mutationFn: async ({ 
      title, 
      x, 
      y, 
      appIds 
    }: { 
      title: string; 
      x: number; 
      y: number;
      appIds: string[];
    }) => {
      if (!userId) throw new Error('No user');

      // Create folder
      const { data: folder, error: folderError } = await supabase
        .from('user_pin_folders')
        .insert({
          user_id: userId,
          section: 'home',
          title,
          sort_index: folders.length,
        })
        .select()
        .single();

      if (folderError) throw folderError;

      // Move apps into folder
      const { error: updateError } = await supabase
        .from('user_pins')
        .update({ folder_id: folder.id })
        .in('ref_id', appIds);

      if (updateError) throw updateError;

      return folder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-pins', userId] });
      queryClient.invalidateQueries({ queryKey: ['app-folders', userId] });
    },
  });

  const deleteFolder = useMutation({
    mutationFn: async (folderId: string) => {
      // Move apps out of folder first
      await supabase
        .from('user_pins')
        .update({ folder_id: null })
        .eq('folder_id', folderId);

      // Delete folder
      const { error } = await supabase
        .from('user_pin_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-pins', userId] });
      queryClient.invalidateQueries({ queryKey: ['app-folders', userId] });
    },
  });

  return {
    pins,
    folders,
    isLoading: isLoading || isLoadingFolders,
    updatePosition,
    pinApp,
    unpinApp,
    createFolder,
    deleteFolder,
  };
}
