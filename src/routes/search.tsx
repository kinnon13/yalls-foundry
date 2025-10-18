import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SEOHelmet } from '@/lib/seo/helmet';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search as SearchIcon, Loader2, ExternalLink, Flag, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRocker } from '@/lib/ai/rocker/RockerProvider';
import { RockerHint } from '@/components/rocker/RockerHint';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { log } = useRocker();

  useEffect(() => {
    // Log page view
    log('page_view', { section: 'discovery_search' });
  }, [log]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q, searchParams.get('category') || 'all');
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string, searchCategory: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      let data: any[] = [];

      // Search based on category
      if (searchCategory === 'all' || searchCategory === 'horses') {
        const { data: horses } = await supabase
          .from('entity_profiles')
          .select('*')
          .eq('entity_type', 'horse')
          .ilike('name', `%${searchQuery}%`)
          .limit(10);
        
        data = [...data, ...(horses || []).map(h => ({ ...h, resultType: 'horse' }))];
      }

      if (searchCategory === 'all' || searchCategory === 'businesses') {
        const { data: businesses } = await supabase
          .from('businesses')
          .select('*')
          .ilike('name', `%${searchQuery}%`)
          .limit(10);
        
        data = [...data, ...(businesses || []).map(b => ({ ...b, resultType: 'business' }))];
      }

      if (searchCategory === 'all' || searchCategory === 'events') {
        const { data: events } = await supabase
          .from('calendar_events')
          .select('*')
          .ilike('title', `%${searchQuery}%`)
          .limit(10);
        
        data = [...data, ...(events || []).map(e => ({ ...e, resultType: 'event' }))];
      }

      if (searchCategory === 'all' || searchCategory === 'users') {
        const { data: users } = await supabase
          .from('profiles')
          .select('*')
          .ilike('display_name', `%${searchQuery}%`)
          .limit(10);
        
        data = [...data, ...(users || []).map(u => ({ ...u, name: u.display_name, resultType: 'user' }))];
      }

      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    log('search_query', { query, category });
    setSearchParams({ q: query, category });
    performSearch(query, category);
  };

  return (
    <>
      <SEOHelmet title="Search" description="Search horses, businesses, events, and more" />
      <GlobalHeader />
      <main className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Rocker Hint */}
          <RockerHint
            suggestion="Try searching for horses, events, or businesses to discover the community"
            reason="Search helps you find profiles, upcoming events, and connect with other users"
            rateLimit="rocker_search_hint"
          />
          
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">Search</h1>
            
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="search"
                placeholder="Search for horses, businesses, events..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                Search
              </Button>
            </form>

            <Tabs value={category} onValueChange={setCategory}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="horses">Horses</TabsTrigger>
                <TabsTrigger value="businesses">Businesses</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
              </TabsList>

              <TabsContent value={category} className="space-y-4 mt-6">
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      {query ? 'No results found. Try a different search term.' : 'Enter a search query to get started.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {results.map((result) => (
                      <Card key={result.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            {result.name || result.title}
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                              {result.resultType}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            {result.description || 'No description available'}
                          </p>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            {(result.resultType === 'horse' || result.resultType === 'business') && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  asChild
                                >
                                  <Link to={`/profile/${result.id}`}>
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    View
                                  </Link>
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  asChild
                                >
                                  <Link to={`/dashboard?tab=profiles&action=claim&id=${result.id}`}>
                                    <Flag className="h-4 w-4 mr-1" />
                                    Claim
                                  </Link>
                                </Button>
                              </>
                            )}
                            
                            {result.resultType === 'event' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  asChild
                                >
                                  <Link to={`/dashboard?tab=calendar&eventId=${result.id}`}>
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    View
                                  </Link>
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  asChild
                                >
                                  <Link to={`/dashboard?tab=calendar&action=add&eventId=${result.id}`}>
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Add to Calendar
                                  </Link>
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </>
  );
}
