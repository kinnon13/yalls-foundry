import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Pin, Trash2, Brain, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Memory {
  id: string;
  kind: string;
  key: string;
  value: any;
  pinned: boolean;
  priority: number;
  created_at: string;
}

export function SuperRockerMemory() {
  const { toast } = useToast();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmbedding, setIsEmbedding] = useState(false);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rocker_long_memory')
        .select('*')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMemories(data as Memory[]);
    } catch (error: any) {
      console.error('Failed to load memories:', error);
      toast({
        title: 'Failed to load memories',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePin = async (id: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('rocker_long_memory')
        .update({ pinned: !currentPinned })
        .eq('id', id);

      if (error) throw error;
      await loadMemories();
      toast({ title: currentPinned ? 'Unpinned' : 'Pinned' });
    } catch (error: any) {
      toast({
        title: 'Failed to toggle pin',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteMemory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rocker_long_memory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadMemories();
      toast({ title: 'Memory deleted' });
    } catch (error: any) {
      toast({
        title: 'Failed to delete',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const generateEmbeddings = async () => {
    setIsEmbedding(true);
    try {
      const { data, error } = await supabase.functions.invoke('andy-embed-knowledge');
      
      if (error) throw error;
      
      toast({
        title: 'Embeddings Generated',
        description: `Processed ${data.processed} chunks. Andy can now search your files!`,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to generate embeddings',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsEmbedding(false);
    }
  };

  const filteredMemories = memories.filter(m => {
    if (!searchQuery) return true;
    const text = JSON.stringify(m.value).toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Memory</h2>
        <Badge variant="outline" className="ml-auto">
          {memories.length} items
        </Badge>
        <Button
          size="sm"
          variant="default"
          onClick={generateEmbeddings}
          disabled={isEmbedding}
          className="gap-2"
        >
          <Zap className="h-4 w-4" />
          {isEmbedding ? 'Embedding...' : 'Generate Embeddings'}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search memories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-2 pr-4">
          {filteredMemories.map((mem) => (
            <div
              key={mem.id}
              className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {mem.kind}
                    </Badge>
                    {mem.pinned && <Pin className="h-3 w-3 text-primary" />}
                    {mem.key && (
                      <span className="text-xs text-muted-foreground truncate">
                        {mem.key}
                      </span>
                    )}
                  </div>
                  <p className="text-sm line-clamp-2">
                    {mem.value?.text || JSON.stringify(mem.value).slice(0, 100)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => togglePin(mem.id, mem.pinned)}
                  >
                    <Pin className={`h-4 w-4 ${mem.pinned ? 'text-primary' : ''}`} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteMemory(mem.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}