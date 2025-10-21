import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Brain, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmbeddingStatus } from './EmbeddingStatus';

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

const PAGE_SIZE = 50;

export function SuperRockerKnowledge() {
  const { toast } = useToast();
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([]);
  const [stats, setStats] = useState<EmbeddingStats>({ total: 0, embedded: 0, pending: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [threadId, setThreadId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());
  const [isReembedding, setIsReembedding] = useState(false);
  const [reembedProgress, setReembedProgress] = useState<string>('');

  useEffect(() => {
    loadKnowledge(true);
    loadStats();
  }, [filterCategory, threadId]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery) {
        loadKnowledge(true);
      }
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const loadStats = async () => {
    try {
      const { count: total } = await supabase
        .from('rocker_knowledge')
        .select('*', { count: 'exact', head: true });

      const { count: embedded } = await supabase
        .from('rocker_knowledge')
        .select('*', { count: 'exact', head: true })
        .not('embedding', 'is', null);

      setStats({
        total: total ?? 0,
        embedded: embedded ?? 0,
        pending: (total ?? 0) - (embedded ?? 0)
      });
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadKnowledge = async (reset = false) => {
    setIsLoading(true);
    const currentPage = reset ? 0 : page;
    
    try {
      let query = supabase
        .from('rocker_knowledge')
        .select('id, content, chunk_index, embedding, meta, created_at, user_id')
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (filterCategory !== 'all') {
        query = query.eq('meta->>category', filterCategory);
      }

      if (threadId) {
        query = query.eq('meta->>thread_id', threadId);
      }

      if (searchQuery) {
        query = query.textSearch('content_tsv', searchQuery, { type: 'websearch' });
      }

      const { data, error } = await query;
      if (error) throw error;
      
      if (reset) {
        setChunks((data || []) as any);
        setPage(0);
      } else {
        setChunks(prev => [...prev, ...((data || []) as any)]);
      }
      
      setHasMore((data || []).length === PAGE_SIZE);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(
          data
            ?.map(c => (c.meta as any)?.category)
            .filter(Boolean) as string[]
        )
      );
      if (reset) {
        setCategories(uniqueCategories);
      }
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

  const loadMore = () => {
    setPage(p => p + 1);
    setTimeout(() => loadKnowledge(false), 0);
  };

  const toggleExpand = (id: string) => {
    setExpandedChunks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleReembed = async () => {
    setIsReembedding(true);
    setReembedProgress('Resetting and re-embedding all knowledge...');
    try {
      const { data, error } = await supabase.functions.invoke('rocker-reembed', {
        body: {
          reset: true,
          sources: ['rocker_knowledge'],
          limit: 500
        }
      });

      if (error) throw error;

      setReembedProgress(`✅ Processed ${data.processed?.rocker_knowledge?.embedded || 0} items`);
      toast({
        title: 'Re-embedding complete',
        description: `Successfully embedded ${data.processed?.rocker_knowledge?.embedded || 0} knowledge items`,
      });
      
      // Refresh knowledge list and stats
      await loadKnowledge(true);
      await loadStats();
    } catch (error: any) {
      console.error('Re-embed error:', error);
      toast({
        title: 'Failed to re-embed',
        description: error.message,
        variant: 'destructive',
      });
      setReembedProgress('❌ Failed');
    } finally {
      setTimeout(() => {
        setIsReembedding(false);
        setReembedProgress('');
      }, 3000);
    }
  };

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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Knowledge Base</h2>
          {reembedProgress && (
            <Badge variant="secondary" className="ml-2">
              {reembedProgress}
            </Badge>
          )}
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={handleReembed}
          disabled={isReembedding}
        >
          {isReembedding ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Re-embedding...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Re-embed Now
            </>
          )}
        </Button>
      </div>
      
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

      {stats.pending > 0 && <EmbeddingStatus />}

      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search knowledge..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
      </div>

      <Input
        placeholder="Filter by thread ID (optional)"
        value={threadId}
        onChange={(e) => setThreadId(e.target.value)}
      />

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
          {chunks.map(chunk => {
            const isExpanded = expandedChunks.has(chunk.id);
            const preview = chunk.content.substring(0, 300);
            const needsExpand = chunk.content.length > 300;
            
            return (
              <Card key={chunk.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
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
                    {chunk.meta?.thread_id && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {chunk.meta.thread_id.substring(0, 8)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(chunk.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {isExpanded ? chunk.content : preview}
                  {needsExpand && !isExpanded && '...'}
                </p>
                
                {needsExpand && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(chunk.id)}
                    className="mt-2 h-7 text-xs"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Show more
                      </>
                    )}
                  </Button>
                )}
                
                {chunk.meta?.subject && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {chunk.meta.subject}
                    </Badge>
                  </div>
                )}
              </Card>
            );
          })}

          {chunks.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No knowledge chunks found</p>
              <p className="text-sm mt-1">Add content to Rocker's memory from the Vault</p>
            </div>
          )}

          {hasMore && !isLoading && chunks.length > 0 && (
            <Button
              variant="outline"
              onClick={loadMore}
              className="w-full"
            >
              Load More
            </Button>
          )}

          {isLoading && (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">Loading...</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}