import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type PinType = 'entity' | 'app' | 'route' | 'folder';

type PinInput = {
  pin_type: PinType;
  ref_id: string;
  title?: string;
  metadata?: Record<string, any>;
  folder_id?: string | null;
};

type Pin = PinInput & {
  id: string;
  user_id: string;
  sort_index: number;
  created_at: string;
};

export function useProfilePins(userId: string | null) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: pins = [], ...pinsQ } = useQuery({
    queryKey: ['pins', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_pins' as any)
        .select('*')
        .eq('user_id', userId)
        .order('sort_index', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Pin[];
    },
    enabled: !!userId,
  });

  const add = useMutation({
    mutationFn: async (pin: PinInput) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('user_pins' as any)
        .upsert([{ user_id: userId, ...pin }], { 
          onConflict: 'user_id,pin_type,ref_id',
          ignoreDuplicates: false 
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pins', userId] });
      toast({ title: 'Pinned to My Apps' });
    },
    onError: (error) => {
      toast({ title: 'Failed to pin', description: String(error), variant: 'destructive' });
    },
  });

  const remove = useMutation({
    mutationFn: async (pin: { pin_type: string; ref_id: string }) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('user_pins' as any)
        .delete()
        .match({ user_id: userId, pin_type: pin.pin_type, ref_id: pin.ref_id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pins', userId] });
      toast({ title: 'Unpinned' });
    },
    onError: (error) => {
      toast({ title: 'Failed to unpin', description: String(error), variant: 'destructive' });
    },
  });

  const move = useMutation({
    mutationFn: async ({ id, folder_id, sort_index }: { id: string; folder_id?: string | null; sort_index?: number }) => {
      const { error } = await supabase
        .from('user_pins' as any)
        .update({ folder_id: folder_id ?? null, sort_index })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pins', userId] });
    },
  });

  return { data: pins, ...pinsQ, add, remove, move };
}
