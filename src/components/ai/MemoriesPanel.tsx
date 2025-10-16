/**
 * Memories Panel - SpaceX-clean 3-panel layout
 * Features: server-side search, pagination, heat by last_used_at, frequency sort
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, Flame, Thermometer, Snowflake, Pin, PinOff, 
  Trash2, Calendar, TrendingUp, Copy, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDebounced } from '@/hooks/useDebounced';

interface Memory {
  id: string;
  type: string;
  namespace: string | null;
  key: string;
  value: any;
  confidence: number;
  sensitivity: string;
  tags: string[];
  source: string;
  use_count: number;
  pinned: boolean;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

type SortOption = 'recent' | 'frequent' | 'oldest' | 'confidence';
type HeatFilter = 'all' | 'hot' | 'warm' | 'cold';

import { BackfillMemoriesButton } from './BackfillMemoriesButton';

export function MemoriesPanel() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [heatFilter, setHeatFilter] = useState<HeatFilter>('all');
  const [namespaces, setNamespaces] = useState<Array<{ name: string; count: number }>>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const debouncedSearch = useDebounced(searchQuery, 350);

  // Auto-backfill on first visit
  useEffect(() => {
    autoBackfillIfNeeded();
  }, []);

  // Load memories with server-side filtering
  useEffect(() => {
    loadMemories();
  }, [selectedNamespace, debouncedSearch, sortBy, heatFilter, page]);

  // Load namespaces
  useEffect(() => {
    loadNamespaces();
  }, []);

  // Realtime subscription
  useEffect(() => {
    let channel: any;
    
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) return;
      
      channel = supabase
        .channel('memories-realtime')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'ai_user_memory',
            filter: `user_id=eq.${data.user.id}`
          },
          () => {
            loadMemories();
            loadNamespaces();
          }
        )
        .subscribe();
    });

    return () => { 
      if (channel) supabase.removeChannel(channel); 
    };
  }, []);

  async function autoBackfillIfNeeded() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has any memories
      const { data: existingMemories, error } = await supabase
        .from('ai_user_memory')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (error) throw error;

      // Check if user has conversations
      const { data: conversations, error: convError } = await supabase
        .from('rocker_conversations')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (convError) throw convError;

      // If no memories but has conversations, auto-backfill
      if ((!existingMemories || existingMemories.length === 0) && conversations && conversations.length > 0) {
        toast.info("🧠 Analyzing your past conversations... This will take a moment.");

        // Run backfill in background
        supabase.functions.invoke('analyze-memories').then(({ data, error }) => {
          if (error) {
            console.error('Auto-backfill error:', error);
          } else if (data?.totalExtracted > 0) {
            toast.success(`✅ Extracted ${data.totalExtracted} memories! Refreshing...`);
            setTimeout(() => window.location.reload(), 2000);
          }
        });
      }
    } catch (e) {
      console.error('Auto-backfill check error:', e);
    }
  }

  async function loadNamespaces() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all distinct namespaces with counts
      const { data, error } = await supabase
        .from('ai_user_memory')
        .select('namespace')
        .eq('user_id', user.id);

      if (error) throw error;

      const nsCounts: Record<string, number> = {};
      data?.forEach(row => {
        const ns = row.namespace || 'other';
        nsCounts[ns] = (nsCounts[ns] || 0) + 1;
      });

      const nsList = Object.entries(nsCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setNamespaces([
        { name: 'all', count: data?.length || 0 },
        ...nsList
      ]);
    } catch (e) {
      console.error('Load namespaces error:', e);
    }
  }

  async function loadMemories() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('ai_user_memory')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Namespace filter
      if (selectedNamespace !== 'all') {
        query = query.eq('namespace', selectedNamespace);
      }

      // Search filter (key, value text, tags)
      if (debouncedSearch) {
        const like = `%${debouncedSearch}%`;
        query = query.or(`key.ilike.${like},value::text.ilike.${like},tags.cs.{${debouncedSearch}}`);
      }

      // Heat filter (based on last_used_at)
      if (heatFilter !== 'all') {
        const now = new Date();
        if (heatFilter === 'hot') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          query = query.gte('last_used_at', sevenDaysAgo.toISOString());
        } else if (heatFilter === 'warm') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          query = query
            .lte('last_used_at', sevenDaysAgo.toISOString())
            .gte('last_used_at', thirtyDaysAgo.toISOString());
        } else if (heatFilter === 'cold') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          query = query.lte('last_used_at', thirtyDaysAgo.toISOString());
        }
      }

      // Sorting
      if (sortBy === 'recent') {
        query = query
          .order('last_used_at', { ascending: false })
          .order('updated_at', { ascending: false });
      } else if (sortBy === 'frequent') {
        query = query
          .order('use_count', { ascending: false })
          .order('last_used_at', { ascending: false });
      } else if (sortBy === 'confidence') {
        query = query
          .order('confidence', { ascending: false, nullsFirst: false })
          .order('last_used_at', { ascending: false });
      } else if (sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true });
      }

      // Pagination
      const pageSize = 50;
      const from = page * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      
      setMemories(data || []);
      setHasMore((count || 0) > (page + 1) * pageSize);
    } catch (e) {
      console.error('Load memories error:', e);
      toast.error('Failed to load memories');
    } finally {
      setLoading(false);
    }
  }

  async function togglePin(id: string, currentPinned: boolean) {
    try {
      const { error } = await supabase
        .from('ai_user_memory')
        .update({ pinned: !currentPinned })
        .eq('id', id);

      if (error) throw error;
      
      setMemories(prev => prev.map(m => 
        m.id === id ? { ...m, pinned: !currentPinned } : m
      ));
      
      if (selectedMemory?.id === id) {
        setSelectedMemory({ ...selectedMemory, pinned: !currentPinned });
      }
      
      toast.success(currentPinned ? 'Unpinned' : 'Pinned');
    } catch (e) {
      toast.error('Failed to update pin status');
    }
  }

  async function deleteMemory(id: string) {
    if (!confirm('Delete this memory? This cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('ai_user_memory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setMemories(prev => prev.filter(m => m.id !== id));
      if (selectedMemory?.id === id) setSelectedMemory(null);
      toast.success('Memory deleted');
    } catch (e) {
      toast.error('Failed to delete memory');
    }
  }

  function getHeat(lastUsedAt: string | null): 'hot' | 'warm' | 'cold' {
    if (!lastUsedAt) return 'cold';
    const age = Date.now() - new Date(lastUsedAt).getTime();
    const days = age / (1000 * 60 * 60 * 24);
    if (days < 7) return 'hot';
    if (days < 30) return 'warm';
    return 'cold';
  }

  function formatValue(val: any): string {
    if (typeof val === 'object') {
      return val?.detail || val?.relationship || val?.name || JSON.stringify(val);
    }
    return String(val);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    });
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
      {/* Left: Namespaces */}
      <Card className="col-span-2 p-4 bg-card/50">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Namespaces
          </h3>
        </div>
        <ScrollArea className="h-[calc(100%-2rem)]">
          <div className="space-y-1">
            {namespaces.map(ns => (
              <button
                key={ns.name}
                onClick={() => {
                  setSelectedNamespace(ns.name);
                  setPage(0);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  selectedNamespace === ns.name
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="capitalize">{ns.name}</span>
                  <Badge variant="secondary" className="text-xs">{ns.count}</Badge>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Middle: List */}
      <Card className="col-span-5 flex flex-col bg-card/50">
        <div className="p-4 border-b space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search key, value, tags..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="pl-9 bg-background"
            />
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 flex-1">
              {(['all', 'hot', 'warm', 'cold'] as HeatFilter[]).map(h => (
                <Button
                  key={h}
                  size="sm"
                  variant={heatFilter === h ? "default" : "ghost"}
                  onClick={() => {
                    setHeatFilter(h);
                    setPage(0);
                  }}
                  className="text-xs"
                >
                  {h === 'hot' && <Flame className="h-3 w-3 mr-1" />}
                  {h === 'warm' && <Thermometer className="h-3 w-3 mr-1" />}
                  {h === 'cold' && <Snowflake className="h-3 w-3 mr-1" />}
                  {h === 'all' ? 'All' : h.charAt(0).toUpperCase() + h.slice(1)}
                </Button>
              ))}
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setPage(0);
              }}
              className="text-xs bg-background border rounded-md px-2 py-1"
            >
              <option value="recent">Recent</option>
              <option value="frequent">Frequent</option>
              <option value="oldest">Oldest</option>
              <option value="confidence">Confidence</option>
            </select>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No memories match your search' : 'No memories yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {memories.map(mem => {
                  const heat = getHeat(mem.last_used_at);
                  const isSelected = selectedMemory?.id === mem.id;
                  
                  return (
                    <button
                      key={mem.id}
                      onClick={() => setSelectedMemory(mem)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-all",
                        isSelected 
                          ? "bg-primary/5 border-primary" 
                          : "bg-background hover:bg-muted/50 border-border"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          {mem.pinned && <Pin className="h-3 w-3 text-primary" />}
                          <span className="font-mono text-xs text-primary">{mem.key}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {heat === 'hot' && <Flame className="h-3 w-3 text-orange-500" />}
                          {heat === 'warm' && <Thermometer className="h-3 w-3 text-yellow-500" />}
                          {heat === 'cold' && <Snowflake className="h-3 w-3 text-blue-400" />}
                        </div>
                      </div>
                      
                      <p className="text-sm text-foreground line-clamp-2">
                        {formatValue(mem.value)}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {Math.round((mem.confidence || 0) * 100)}%
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {mem.use_count} uses
                        </Badge>
                        {mem.tags?.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {hasMore && (
                <Button
                  variant="ghost"
                  onClick={() => setPage(p => p + 1)}
                  className="w-full mt-4"
                >
                  Load More
                </Button>
              )}
            </>
          )}
        </ScrollArea>
      </Card>

      {/* Right: Detail */}
      <Card className="col-span-5 p-6 bg-card/50">
        {!selectedMemory ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">Select a memory to view details</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-mono text-sm text-primary">{selectedMemory.key}</h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePin(selectedMemory.id, selectedMemory.pinned)}
                      className="h-7"
                    >
                      {selectedMemory.pinned ? (
                        <PinOff className="h-3 w-3" />
                      ) : (
                        <Pin className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMemory(selectedMemory.id)}
                      className="h-7 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getHeat(selectedMemory.last_used_at) === 'hot' && (
                    <Badge variant="default" className="text-xs">
                      <Flame className="h-3 w-3 mr-1" />Hot
                    </Badge>
                  )}
                  {getHeat(selectedMemory.last_used_at) === 'warm' && (
                    <Badge variant="secondary" className="text-xs">
                      <Thermometer className="h-3 w-3 mr-1" />Warm
                    </Badge>
                  )}
                  {getHeat(selectedMemory.last_used_at) === 'cold' && (
                    <Badge variant="outline" className="text-xs">
                      <Snowflake className="h-3 w-3 mr-1" />Cold
                    </Badge>
                  )}
                  {selectedMemory.pinned && (
                    <Badge variant="default" className="text-xs">
                      <Pin className="h-3 w-3 mr-1" />Pinned
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs capitalize">
                    {selectedMemory.sensitivity}
                  </Badge>
                </div>
              </div>

              {/* Value */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Value
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(JSON.stringify(selectedMemory.value, null, 2))}
                    className="h-6"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {typeof selectedMemory.value === 'object' 
                      ? JSON.stringify(selectedMemory.value, null, 2)
                      : selectedMemory.value
                    }
                  </pre>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Confidence
                  </label>
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(selectedMemory.confidence || 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round((selectedMemory.confidence || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Source
                  </label>
                  <p className="mt-2 text-sm capitalize">{selectedMemory.source}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Use Count
                  </label>
                  <p className="mt-2 text-sm flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    {selectedMemory.use_count} times
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Namespace
                  </label>
                  <p className="mt-2 text-sm capitalize">{selectedMemory.namespace || 'none'}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Created
                  </label>
                  <p className="mt-2 text-sm flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {formatDate(selectedMemory.created_at)}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Last Used
                  </label>
                  <p className="mt-2 text-sm flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    {formatDate(selectedMemory.last_used_at)}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {selectedMemory.tags && selectedMemory.tags.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedMemory.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}
