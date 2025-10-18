/**
 * useAppearance Hook
 * Manages wallpaper and screensaver settings for users and entities
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AppearanceSettings {
  wallpaper_url?: string | null;
  screensaver_payload?: {
    mode?: 'single' | 'slideshow' | 'video';
    items?: Array<{ url: string }>;
    blur?: number;
    dim?: number;
    timeout?: number;
    showClock?: boolean;
  };
}

interface UseAppearanceProps {
  type: 'user' | 'entity';
  id: string;
}

export function useAppearance({ type, id }: UseAppearanceProps) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['appearance', type, id],
    queryFn: async () => {
      const { data } = await supabase
        .from('appearance_settings')
        .select('*')
        .eq('subject_type', type)
        .eq('subject_id', id)
        .maybeSingle();

      return data ?? { wallpaper_url: null, screensaver_payload: {} };
    },
  });

  const update = useMutation({
    mutationFn: async (settings: AppearanceSettings) => {
      await supabase.rpc('set_appearance', {
        p_subject_type: type,
        p_subject_id: id,
        p_wallpaper: settings.wallpaper_url || null,
        p_screensaver: settings.screensaver_payload || {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appearance', type, id] });
    },
  });

  return {
    ...query,
    update,
  };
}
