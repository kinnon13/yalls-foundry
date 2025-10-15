/**
 * What I Know Panel - Unified search across memories and knowledge
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Brain, BookOpen, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDebounced } from '@/hooks/useDebounced';
import { toast } from 'sonner';

interface SearchResult {
  id: string;
  type: 'memory' | 'knowledge';
  title: string;
  content: string;
  confidence: number;
  source: string;
  tags: string[];
}

type FilterType = 'all' | 'memory' | 'knowledge';

export function WhatIKnowPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const debouncedSearch = useDebounced(searchQuery, 350);

  useEffect(() => {
    if (debouncedSearch) {
      performSearch(debouncedSearch);
    } else {
      setResults([]);
    }
  }, [debouncedSearch, filter]);

  async function performSearch(query: string) {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const results: SearchResult[] = [];

      // Search memories
      if (filter === 'all' || filter === 'memory') {
        const like = `%${query}%`;
        const { data: memories } = await supabase
          .from('ai_user_memory')
          .select('id, key, value, confidence, source, tags')
          .eq('user_id', user.id)
          .or(`key.ilike.${like},value::text.ilike.${like},tags.cs.{${query}}`)
          .limit(10);

        memories?.forEach(m => {
          results.push({
            id: m.id,
            type: 'memory',
            title: m.key,
            content: typeof m.value === 'object' ? JSON.stringify(m.value) : String(m.value),
            confidence: (m.confidence || 0) * 100,
            source: m.source,
            tags: m.tags || []
          });
        });
      }

      // Search global knowledge
      if (filter === 'all' || filter === 'knowledge') {
        const like = `%${query}%`;
        const { data: knowledge } = await supabase
          .from('ai_global_knowledge')
          .select('id, key, value, confidence, source, tags')
          .or(`key.ilike.${like},value::text.ilike.${like},tags.cs.{${query}}`)
          .limit(10);

        knowledge?.forEach(k => {
          results.push({
            id: k.id,
            type: 'knowledge',
            title: k.key,
            content: typeof k.value === 'object' ? JSON.stringify(k.value) : String(k.value),
            confidence: (k.confidence || 0) * 100,
            source: k.source,
            tags: k.tags || []
          });
        });
      }

      setResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        <Input
          placeholder="Search my memories and platform knowledge..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 text-base"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button 
          variant={filter === 'memory' ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilter('memory')}
        >
          My Memories
        </Button>
        <Button 
          variant={filter === 'knowledge' ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilter('knowledge')}
        >
          Platform Knowledge
        </Button>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {!searchQuery ? (
          <Card className="bg-card/50">
            <CardContent className="pt-12 pb-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">Start searching to find memories and knowledge</p>
              <p className="text-xs text-muted-foreground mt-2">
                Search across everything Rocker knows about you and the platform
              </p>
            </CardContent>
          </Card>
        ) : results.length === 0 && !loading ? (
          <Card className="bg-card/50">
            <CardContent className="pt-12 pb-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
            </CardContent>
          </Card>
        ) : (
          results.map(result => (
            <Card key={result.id} className="bg-card/50 hover:border-primary transition-colors cursor-pointer">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  {result.type === 'memory' ? (
                    <Brain className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                  ) : (
                    <BookOpen className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={result.type === 'memory' ? "default" : "secondary"}>
                        {result.type.toUpperCase()}
                      </Badge>
                      <span className="font-semibold font-mono text-sm truncate">{result.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {result.content.substring(0, 150)}
                      {result.content.length > 150 && '...'}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {Math.round(result.confidence)}% confidence
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {result.source}
                      </Badge>
                      {result.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
