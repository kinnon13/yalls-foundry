/**
 * Knowledge Browser Panel
 * 
 * Browse, search, and moderate all knowledge base content
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, FileText, Trash2, AlertTriangle, CheckCircle, 
  FolderTree, Users, Globe, User, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth/context';

export default function KnowledgeBrowserPanel() {
  const { session } = useSession();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState<'global' | 'site' | 'user' | 'all'>('all');
  const [category, setCategory] = useState('all');
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadCategories();
    searchKnowledge();
  }, []);

  const loadCategories = async () => {
    try {
      const { data } = await supabase
        .from('knowledge_items')
        .select('category')
        .order('category');
      
      const uniqueCategories = [...new Set(data?.map(d => d.category) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('[KB Browser] Load categories error:', error);
    }
  };

  const searchKnowledge = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('knowledge_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (scope !== 'all') {
        query = query.eq('scope', scope);
      }

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%,uri.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setItems(data || []);
    } catch (error) {
      console.error('[KB Browser] Search error:', error);
      toast.error('Failed to search knowledge base');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (itemId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast.success(`Deleted knowledge item: ${reason}`);
      setItems(items.filter(i => i.id !== itemId));
      setSelectedItem(null);
    } catch (error) {
      console.error('[KB Browser] Delete error:', error);
      toast.error('Failed to delete item');
    }
  };

  const blockItem = async (itemId: string, reason: string) => {
    try {
      // Update permissions to block
      const { error } = await supabase
        .from('knowledge_items')
        .update({
          permissions: {
            visibility: 'blocked',
            block_reason: reason,
            blocked_by: session?.userId,
            blocked_at: new Date().toISOString()
          }
        })
        .eq('id', itemId);

      if (error) throw error;

      toast.success('Blocked knowledge item');
      searchKnowledge();
    } catch (error) {
      console.error('[KB Browser] Block error:', error);
      toast.error('Failed to block item');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Knowledge Browser
          </CardTitle>
          <CardDescription>
            Search, browse, and moderate all knowledge base content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, content, or URI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchKnowledge()}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={scope} onValueChange={(v: any) => setScope(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scopes</SelectItem>
                <SelectItem value="global">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Global
                  </div>
                </SelectItem>
                <SelectItem value="site">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Site
                  </div>
                </SelectItem>
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={searchKnowledge} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setScope('all');
                setCategory('all');
                searchKnowledge();
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Results ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent ${
                      selectedItem?.id === item.id ? 'bg-accent border-primary' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={item.scope === 'global' ? 'default' : 'secondary'} className="text-xs">
                            {item.scope}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{item.category}</span>
                        </div>
                        {item.permissions?.visibility === 'blocked' && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            BLOCKED
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {items.length === 0 && !loading && (
                  <p className="text-center text-muted-foreground py-8">
                    No knowledge items found
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detail View */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detail View</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedItem ? (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Title</div>
                    <div className="font-medium">{selectedItem.title}</div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-muted-foreground">URI</div>
                    <code className="text-xs bg-muted p-1 rounded">{selectedItem.uri}</code>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Scope</div>
                      <Badge variant={selectedItem.scope === 'global' ? 'default' : 'secondary'}>
                        {selectedItem.scope}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Category</div>
                      <span className="text-sm">{selectedItem.category}</span>
                    </div>
                  </div>

                  {selectedItem.subcategory && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Subcategory</div>
                      <span className="text-sm">{selectedItem.subcategory}</span>
                    </div>
                  )}

                  {selectedItem.tags && selectedItem.tags.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Tags</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedItem.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedItem.summary && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Summary</div>
                      <p className="text-sm">{selectedItem.summary}</p>
                    </div>
                  )}

                  {selectedItem.content_excerpt && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Preview</div>
                      <p className="text-sm text-muted-foreground">{selectedItem.content_excerpt}</p>
                    </div>
                  )}

                  {selectedItem.permissions?.visibility === 'blocked' && (
                    <div className="p-3 border border-red-500 rounded-lg bg-red-50 dark:bg-red-950">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">BLOCKED</span>
                      </div>
                      {selectedItem.permissions.block_reason && (
                        <p className="text-sm mt-1 text-red-600 dark:text-red-400">
                          {selectedItem.permissions.block_reason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Moderation Actions */}
                  <div className="space-y-2 pt-4 border-t">
                    <div className="text-sm font-medium">Moderation Actions</div>
                    <div className="space-y-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => {
                          const reason = prompt('Why are you blocking this item?');
                          if (reason) blockItem(selectedItem.id, reason);
                        }}
                        disabled={selectedItem.permissions?.visibility === 'blocked'}
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Block (Inappropriate/Wrong)
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 text-red-600 hover:text-red-700"
                        onClick={() => {
                          const reason = prompt('Why are you deleting this item? (Required)');
                          if (reason && confirm('Are you sure? This cannot be undone.')) {
                            deleteItem(selectedItem.id, reason);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Permanently
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                Select an item to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
