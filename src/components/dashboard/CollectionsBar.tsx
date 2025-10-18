import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CollectionBubble } from './CollectionBubble';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CollectionDrawer } from './CollectionDrawer';
import { toast } from 'sonner';
import { useRocker } from '@/lib/ai/rocker';

type Collection = {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  is_smart: boolean;
  rules: any;
  items: any[];
  smart_items: any[];
};

export function CollectionsBar() {
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const queryClient = useQueryClient();
  const { log } = useRocker();

  const { data: collections } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return [];
      
      const { data, error } = await supabase.functions.invoke('list_collections');
      if (error) throw error;
      return (data as Collection[]) || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('collection_operations', {
        body: { 
          operation: 'create',
          p_name: 'New Folder',
          p_emoji: '📁',
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Folder created');
      log('create_collection', { name: 'New Folder' });
    },
    onError: () => {
      toast.error('Failed to create folder');
    },
  });

  if (!collections || collections.length === 0) {
    return (
      <div className="flex items-center gap-4 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => createMutation.mutate()}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Folder
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Collections</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createMutation.mutate()}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Folder
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {collections.map((collection) => (
            <CollectionBubble
              key={collection.id}
              id={collection.id}
              name={collection.name}
              emoji={collection.emoji}
              color={collection.color}
              itemCount={collection.items.length}
              onClick={() => {
                setSelectedCollection(collection);
                log('open_collection', { collection_id: collection.id });
              }}
            />
          ))}
        </div>
      </div>

      <CollectionDrawer
        collection={selectedCollection}
        open={!!selectedCollection}
        onClose={() => setSelectedCollection(null)}
      />
    </>
  );
}
