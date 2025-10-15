/**
 * Memories Panel - SpaceX-inspired clean UI
 * 3-panel layout: Namespaces | List | Detail
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Search, Flame, Thermometer, Snowflake, Eye, EyeOff, Pin, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Memory {
  id: string;
  type: string;
  key: string;
  value: any;
  confidence: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  source: string;
}

type SortOption = 'recent' | 'frequent' | 'oldest' | 'confidence';
type HeatFilter = 'all' | 'hot' | 'warm' | 'cold';

export function MemoriesPanel() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [heatFilter, setHeatFilter] = useState<HeatFilter>('all');

  useEffect(() => {
    loadMemories();
    
    // Realtime updates
    const channel = supabase
      .channel('memories-panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_user_memory' }, () => {
        loadMemories();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadMemories() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_user_memory')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setMemories(data || []);
    } catch (e) {
      console.error('Load memories error:', e);
      toast.error('Failed to load memories');
    } finally {
      setLoading(false);
    }
  }

  async function deleteMemory(id: string) {
    if (!confirm('Delete this memory?')) return;
    
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

  // Extract namespaces from memory keys (e.g., "family_mom" → "family")
  const namespaces = useMemo(() => {
    const ns = new Set<string>();
    memories.forEach(m => {
      const parts = m.key.split('_');
      if (parts.length > 1) ns.add(parts[0]);
    });
    return ['all', ...Array.from(ns).sort()];
  }, [memories]);

  // Filter and sort
  const filteredMemories = useMemo(() => {
    let filtered = memories;

    // Namespace filter
    if (selectedNamespace !== 'all') {
      filtered = filtered.filter(m => m.key.startsWith(selectedNamespace + '_'));
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.key.toLowerCase().includes(q) ||
        JSON.stringify(m.value).toLowerCase().includes(q) ||
        m.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    // Heat filter (mock: based on recency)
    if (heatFilter !== 'all') {
      const now = Date.now();
      filtered = filtered.filter(m => {
        const age = now - new Date(m.updated_at).getTime();
        const days = age / (1000 * 60 * 60 * 24);
        if (heatFilter === 'hot') return days < 7;
        if (heatFilter === 'warm') return days >= 7 && days < 30;
        if (heatFilter === 'cold') return days >= 30;
        return true;
      });
    }

    // Sort
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'confidence') {
      filtered.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    }

    return filtered;
  }, [memories, selectedNamespace, searchQuery, sortBy, heatFilter]);

  function getHeat(updatedAt: string): 'hot' | 'warm' | 'cold' {
    const age = Date.now() - new Date(updatedAt).getTime();
    const days = age / (1000 * 60 * 60 * 24);
    if (days < 7) return 'hot';
    if (days < 30) return 'warm';
    return 'cold';
  }

  function formatValue(val: any): string {
    if (typeof val === 'object') {
      return val?.detail || val?.relationship || JSON.stringify(val);
    }
    return String(val);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    });
  }

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
      {/* Left: Namespaces */}
      <Card className="col-span-2 p-4 bg-card/50">
        <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Namespaces</h3>
        <ScrollArea className="h-[calc(100%-2rem)]">
          <div className="space-y-1">
            {namespaces.map(ns => {
              const count = ns === 'all' 
                ? memories.length 
                : memories.filter(m => m.key.startsWith(ns + '_')).length;
              
              return (
                <button
                  key={ns}
                  onClick={() => setSelectedNamespace(ns)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                    selectedNamespace === ns
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize">{ns}</span>
                    <Badge variant="secondary" className="text-xs">{count}</Badge>
                  </div>
                </button>
              );
            })}
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
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                  onClick={() => setHeatFilter(h)}
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
              onChange={(e) => setSortBy(e.target.value as SortOption)}
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
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : filteredMemories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No memories found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMemories.map(mem => {
                const heat = getHeat(mem.updated_at);
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
                      <span className="font-mono text-xs text-primary">{mem.key}</span>
                      <div className="flex items-center gap-1">
                        {heat === 'hot' && <Flame className="h-3 w-3 text-orange-500" />}
                        {heat === 'warm' && <Thermometer className="h-3 w-3 text-yellow-500" />}
                        {heat === 'cold' && <Snowflake className="h-3 w-3 text-blue-400" />}
                      </div>
                    </div>
                    
                    <p className="text-sm text-foreground truncate">
                      {formatValue(mem.value)}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {Math.round((mem.confidence || 0) * 100)}%
                      </Badge>
                      {mem.tags?.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
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
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-mono text-sm text-primary">{selectedMemory.key}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMemory(selectedMemory.id)}
                  className="h-7"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {getHeat(selectedMemory.updated_at) === 'hot' && (
                  <Badge variant="default" className="text-xs">
                    <Flame className="h-3 w-3 mr-1" />Hot
                  </Badge>
                )}
                {getHeat(selectedMemory.updated_at) === 'warm' && (
                  <Badge variant="secondary" className="text-xs">
                    <Thermometer className="h-3 w-3 mr-1" />Warm
                  </Badge>
                )}
                {getHeat(selectedMemory.updated_at) === 'cold' && (
                  <Badge variant="outline" className="text-xs">
                    <Snowflake className="h-3 w-3 mr-1" />Cold
                  </Badge>
                )}
              </div>
            </div>

            {/* Value */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Value</label>
              <div className="mt-2 p-4 rounded-lg bg-muted/50 border">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {JSON.stringify(selectedMemory.value, null, 2)}
                </pre>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confidence</label>
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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source</label>
                <p className="mt-2 text-sm capitalize">{selectedMemory.source}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</label>
                <p className="mt-2 text-sm flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {formatDate(selectedMemory.created_at)}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Used</label>
                <p className="mt-2 text-sm flex items-center gap-2">
                  <TrendingUp className="h-3 w-3" />
                  {formatDate(selectedMemory.updated_at)}
                </p>
              </div>
            </div>

            {/* Tags */}
            {selectedMemory.tags && selectedMemory.tags.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedMemory.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
