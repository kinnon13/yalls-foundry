/**
 * Andy Memory Collections - Organize memories into folders
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { FolderPlus, Folder, Sparkles, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  memory_count?: number;
}

interface Memory {
  id: string;
  content: string;
  memory_type: string;
}

export function AndyCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');
  const [newCollectionColor, setNewCollectionColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollections();
    loadMemories();
  }, []);

  const loadCollections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('andy_memory_collections')
        .select('*, andy_collection_items(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const collectionsWithCount = data?.map((c: any) => ({
        ...c,
        memory_count: c.andy_collection_items?.[0]?.count || 0
      })) || [];

      setCollections(collectionsWithCount);
    } catch (error) {
      console.error('Failed to load collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const loadMemories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('ai_user_memory')
        .select('id, content, memory_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMemories(data || []);
    } catch (error) {
      console.error('Failed to load memories:', error);
    }
  };

  const createCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error('Collection name required');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase as any)
        .from('andy_memory_collections')
        .insert({
          user_id: user.id,
          name: newCollectionName,
          description: newCollectionDesc || null,
          color: newCollectionColor
        });

      if (error) throw error;

      toast.success('Collection created');
      setNewCollectionName('');
      setNewCollectionDesc('');
      loadCollections();
    } catch (error) {
      console.error('Failed to create collection:', error);
      toast.error('Failed to create collection');
    }
  };

  const autoSuggestCollections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setLoading(true);
      const { data, error } = await supabase.rpc('andy_suggest_collections', {
        p_user_id: user.id
      });

      if (error) throw error;

      // Create suggested collections
      for (const suggestion of data || []) {
        await (supabase as any)
          .from('andy_memory_collections')
          .insert({
            user_id: user.id,
            name: suggestion.suggested_name,
            description: `Auto-suggested based on ${suggestion.memory_count} memories`,
            color: '#8b5cf6'
          });
      }

      toast.success(`Created ${data?.length || 0} suggested collections`);
      loadCollections();
    } catch (error) {
      console.error('Failed to suggest collections:', error);
      toast.error('Failed to auto-suggest collections');
    } finally {
      setLoading(false);
    }
  };

  const addMemoryToCollection = async (memoryId: string, collectionId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('andy_collection_items')
        .insert({
          collection_id: collectionId,
          memory_id: memoryId
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('Memory already in collection');
        } else {
          throw error;
        }
      } else {
        toast.success('Memory added to collection');
        loadCollections();
      }
    } catch (error) {
      console.error('Failed to add memory:', error);
      toast.error('Failed to add memory');
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Folder className="w-4 h-4" />
          Memory Collections ({collections.length})
        </h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={autoSuggestCollections} disabled={loading}>
            <Sparkles className="w-3 h-3 mr-1" />
            Auto-Suggest
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <FolderPlus className="w-3 h-3 mr-1" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Collection</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Collection name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newCollectionDesc}
                  onChange={(e) => setNewCollectionDesc(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm">Color:</label>
                  <input
                    type="color"
                    value={newCollectionColor}
                    onChange={(e) => setNewCollectionColor(e.target.value)}
                    className="h-8 w-16"
                  />
                </div>
                <Button onClick={createCollection} className="w-full">
                  Create Collection
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {collections.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No collections yet. Create one or use Auto-Suggest!
            </p>
          )}
          {collections.map((col) => (
            <Card key={col.id} className="p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: col.color }}
                  />
                  <div>
                    <p className="font-medium">{col.name}</p>
                    {col.description && (
                      <p className="text-xs text-muted-foreground">{col.description}</p>
                    )}
                  </div>
                </div>
                <Badge variant="outline">{col.memory_count || 0} memories</Badge>
              </div>

              {selectedCollection === col.id && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium mb-2">Add memories:</p>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-1">
                      {memories.map((mem) => (
                        <div
                          key={mem.id}
                          className="flex items-center justify-between p-2 hover:bg-muted rounded text-xs"
                        >
                          <p className="flex-1 truncate">{mem.content.slice(0, 60)}...</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addMemoryToCollection(mem.id, col.id)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={() => setSelectedCollection(selectedCollection === col.id ? null : col.id)}
              >
                {selectedCollection === col.id ? 'Hide' : 'Add Memories'}
              </Button>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
