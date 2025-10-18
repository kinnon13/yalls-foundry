import { X, Trash2, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { AppBubble } from './AppBubble';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type Collection = {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  items: Array<{
    item_type: 'entity' | 'horse' | 'app';
    context_id?: string;
    app_key?: string;
    pinned: boolean;
    sort_order: number;
  }>;
};

type CollectionDrawerProps = {
  collection: Collection | null;
  open: boolean;
  onClose: () => void;
};

export function CollectionDrawer({ collection, open, onClose }: CollectionDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const queryClient = useQueryClient();

  const renameMutation = useMutation({
    mutationFn: async (newName: string) => {
      if (!collection) return;
      const { data, error } = await supabase.functions.invoke('collection_operations', {
        body: { 
          operation: 'rename',
          p_id: collection.id,
          p_name: newName,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection renamed');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to rename collection');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!collection) return;
      const { data, error } = await supabase.functions.invoke('collection_operations', {
        body: { 
          operation: 'delete',
          p_id: collection.id,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection deleted');
      onClose();
    },
    onError: () => {
      toast.error('Failed to delete collection');
    },
  });

  const handleRename = () => {
    if (editName.trim()) {
      renameMutation.mutate(editName);
    }
  };

  const handleStartEdit = () => {
    setEditName(collection?.name || '');
    setIsEditing(true);
  };

  if (!collection) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  autoFocus
                />
                <Button size="sm" onClick={handleRename}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <span className="flex items-center gap-2">
                  {collection.emoji && <span>{collection.emoji}</span>}
                  {collection.name}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={handleStartEdit}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {collection.items.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground py-8">
              No items in this collection yet
            </div>
          ) : (
            collection.items.map((item, idx) => (
              <AppBubble
                key={idx}
                icon={<span>📦</span>}
                title={item.app_key || 'Item'}
                meta={item.item_type}
                to="#"
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
