/**
 * Profile Bubbles - Pin/Drag/Reorder (<200 LOC)
 * Max 8 visible, overflow to "More" bar
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical, X } from 'lucide-react';
import { toast } from 'sonner';

type Pin = {
  id: string;
  item_type: string;
  item_data: any;
  position: number;
};

export function ProfileBubbles({ profileId }: { profileId: string }) {
  const queryClient = useQueryClient();
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const { data: pins = [] } = useQuery({
    queryKey: ['profile-pins', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_pins')
        .select('*')
        .eq('profile_id', profileId)
        .order('position');

      if (error) throw error;
      return data as Pin[];
    }
  });

  const reorderMutation = useMutation({
    mutationFn: async (newOrder: { id: string; position: number }[]) => {
      await supabase.rpc('reorder_pins', {
        p_profile_id: profileId,
        p_pin_positions: newOrder
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-pins', profileId] });
      toast.success('Pins reordered');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (pinId: string) => {
      const { error } = await supabase
        .from('profile_pins')
        .delete()
        .eq('id', pinId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-pins', profileId] });
      toast.success('Pin removed');
    }
  });

  const visiblePins = pins.slice(0, 8);
  const overflowPins = pins.slice(8);

  const handleDragStart = (pinId: string) => setDraggedId(pinId);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = pins.findIndex(p => p.id === draggedId);
    const targetIndex = pins.findIndex(p => p.id === targetId);

    const newPins = [...pins];
    const [removed] = newPins.splice(draggedIndex, 1);
    newPins.splice(targetIndex, 0, removed);

    const newOrder = newPins.map((p, i) => ({ id: p.id, position: i }));
    reorderMutation.mutate(newOrder);
    setDraggedId(null);
  };

  return (
    <div className="space-y-4">
      {/* Visible bubbles (max 8) */}
      <div className="flex flex-wrap gap-3">
        {visiblePins.map((pin) => (
          <div
            key={pin.id}
            draggable
            onDragStart={() => handleDragStart(pin.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(pin.id)}
            className="relative group flex items-center gap-2 px-4 py-2 bg-secondary rounded-full cursor-move hover:bg-secondary/80 transition-colors"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {pin.item_data.title || pin.item_type}
            </span>
            <button
              onClick={() => deleteMutation.mutate(pin.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        <Button variant="outline" size="sm" className="rounded-full">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Overflow bar */}
      {overflowPins.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground mb-2">More:</p>
          <div className="flex flex-wrap gap-2">
            {overflowPins.map((pin) => (
              <span key={pin.id} className="text-sm px-2 py-1 bg-muted rounded">
                {pin.item_data.title || pin.item_type}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
