import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KBTreeView } from './KBTreeView';
import { KBSearchBar } from './KBSearchBar';
import { KBResultCard } from './KBResultCard';
import { KBMarkdownViewer } from './KBMarkdownViewer';
import { searchKnowledge, getKnowledgeItem } from '@/lib/ai/rocker/kb';
import type { KnowledgeItem } from '@/lib/ai/rocker/kb';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function KnowledgeBrowser() {
  const [scope, setScope] = useState<'global' | 'site' | 'user'>('global');
  const [results, setResults] = useState<KnowledgeItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    subcategory: '',
    tags: [] as string[]
  });

  // Initial load - fetch all for current scope
  useEffect(() => {
    loadKnowledge();
  }, [scope, filters]);

  const loadKnowledge = async () => {
    setLoading(true);
    try {
      const data = await searchKnowledge({
        q: '',
        scope,
        category: filters.category || undefined,
        subcategory: filters.subcategory || undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        limit: 50
      });
      setResults(data);
    } catch (error) {
      console.error('[KB Browser] Load error:', error);
      toast.error('Failed to load knowledge');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadKnowledge();
      return;
    }

    setLoading(true);
    try {
      const data = await searchKnowledge({
        q: query,
        scope,
        category: filters.category || undefined,
        subcategory: filters.subcategory || undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        limit: 50
      });
      setResults(data);
    } catch (error) {
      console.error('[KB Browser] Search error:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = async (item: KnowledgeItem) => {
    try {
      const fullItem = await getKnowledgeItem(item.uri);
      setSelectedItem(fullItem);
    } catch (error) {
      console.error('[KB Browser] Item load error:', error);
      toast.error('Failed to load item');
    }
  };

  const handleCategorySelect = (category: string, subcategory?: string) => {
    setFilters(prev => ({
      ...prev,
      category,
      subcategory: subcategory || ''
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <Tabs value={scope} onValueChange={(v) => setScope(v as any)} className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-12 bg-background">
          <TabsTrigger value="global" className="data-[state=active]:bg-accent">
            Global
          </TabsTrigger>
          <TabsTrigger value="site" className="data-[state=active]:bg-accent">
            Site
          </TabsTrigger>
          <TabsTrigger value="user" className="data-[state=active]:bg-accent">
            User
          </TabsTrigger>
        </TabsList>

        <TabsContent value={scope} className="flex-1 m-0 p-0">
          <div className="flex h-[calc(100vh-12rem)]">
            {/* Left Sidebar - Tree Navigation */}
            <div className="w-64 border-r bg-muted/30 overflow-y-auto">
              <KBTreeView 
                scope={scope}
                onSelect={handleCategorySelect}
                selectedCategory={filters.category}
                selectedSubcategory={filters.subcategory}
              />
            </div>

            {/* Middle - Search & Results */}
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b bg-background">
                <KBSearchBar
                  value={searchQuery}
                  onChange={handleSearch}
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    No knowledge items found
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {results.map((item) => (
                      <KBResultCard
                        key={item.id}
                        item={item}
                        onClick={() => handleSelectItem(item)}
                        isSelected={selectedItem?.id === item.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right - Markdown Viewer */}
            {selectedItem && (
              <div className="w-[600px] border-l overflow-y-auto">
                <KBMarkdownViewer 
                  item={selectedItem}
                  onClose={() => setSelectedItem(null)}
                  onUpdate={loadKnowledge}
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
