import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Brain, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface KnowledgeChunk {
  id: string;
  content: string;
  chunk_index: number;
  embedding: string | null;
  meta: Record<string, any>;
  created_at: string;
  user_id: string;
}

interface EmbeddingStats {
  total: number;
  embedded: number;
  pending: number;
}

export function SuperRockerKnowledge() {
  const { toast } = useToast();
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([]);
  const [stats, setStats] = useState<EmbeddingStats>({ total: 0, embedded: 0, pending: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadKnowledge();
    loadStats();
  }, [filterCategory]);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('rocker_knowledge')
        .select('embedding', { count: 'exact', head: false });
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const embedded = data?.filter(r => r.embedding !== null).length || 0;
      
      setStats({
        total,
        embedded,
        pending: total - embedded
      });
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadKnowledge = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('rocker_knowledge')
        .select('id, content, chunk_index, embedding, meta, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filterCategory !== 'all') {
        query = query.eq('meta->>category', filterCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setChunks((data || []) as any);
      
      // Extract unique categories from meta
      const uniqueCategories = Array.from(
        new Set(
          data
            ?.map(c => (c.meta as any)?.category)
            .filter(Boolean) as string[]
        )
      );
      setCategories(uniqueCategories);
    } catch (error: any) {
      console.error('Failed to load knowledge:', error);
      toast({
        title: 'Failed to load knowledge',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChunks = chunks.filter(chunk => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return chunk.content.toLowerCase().includes(query);
  });

  const getStatusIcon = (chunk: KnowledgeChunk) => {
    if (chunk.embedding) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = (chunk: KnowledgeChunk) => {
    return chunk.embedding ? 'Embedded' : 'Pending';
  };

  const progress = stats.total > 0 ? Math.round((stats.embedded / stats.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Chunks</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Embedded</p>
              <p className="text-2xl font-bold">{stats.embedded}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </Card>
      </div>

      {stats.pending > 0 && (
        <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Indexing in Progress</p>
              <p className="text-sm text-muted-foreground mt-1">
                {progress}% complete ({stats.embedded}/{stats.total} chunks embedded). 
                Workers are processing the queue every 2 minutes.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search knowledge..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterCategory('all')}
        >
          All
        </Button>
        {categories.map(cat => (
          <Button
            key={cat}
            variant={filterCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-3 pr-4">
          {filteredChunks.map(chunk => (
            <Card key={chunk.id} className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(chunk)}
                  <Badge variant="outline" className="text-xs">
                    {getStatusText(chunk)}
                  </Badge>
                  {chunk.meta?.category && (
                    <Badge variant="secondary" className="text-xs">
                      {chunk.meta.category}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Chunk #{chunk.chunk_index}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(chunk.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <p className="text-sm line-clamp-3 text-muted-foreground">
                {chunk.content}
              </p>
              
              {chunk.meta?.subject && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {chunk.meta.subject}
                  </Badge>
                </div>
              )}
            </Card>
          ))}

          {filteredChunks.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No knowledge chunks found</p>
              <p className="text-sm mt-1">Add content to Rocker's memory from the Vault</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}