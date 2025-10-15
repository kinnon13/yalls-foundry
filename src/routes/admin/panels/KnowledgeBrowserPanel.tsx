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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search, FileText, Trash2, AlertTriangle, CheckCircle, 
  FolderTree, Users, Globe, User, Loader2, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth/context';
import { ingestKnowledge } from '@/lib/ai/rocker/kb';

export default function KnowledgeBrowserPanel() {
  const { session } = useSession();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState<'global' | 'site' | 'user' | 'all'>('all');
  const [category, setCategory] = useState('all');
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newUri, setNewUri] = useState('');
  const [adding, setAdding] = useState(false);
  const [userMemory, setUserMemory] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    loadCategories();
    searchKnowledge();
    if (session?.userId) {
      loadUserProfile();
      loadUserMemory();
      loadConversations();
    }
  }, []);

  useEffect(() => {
    searchKnowledge();
  }, [scope, category]);

  const loadUserProfile = async () => {
    try {
      // Get auth user info
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session?.userId)
        .maybeSingle();
      
      setUserProfile({
        email: user?.email,
        userId: user?.id,
        ...profile
      });
    } catch (error) {
      console.error('[KB Browser] Load profile error:', error);
    }
  };

  const loadUserMemory = async () => {
    try {
      const { data } = await supabase
        .from('ai_user_memory')
        .select('*')
        .eq('user_id', session?.userId)
        .order('updated_at', { ascending: false })
        .limit(20);
      
      setUserMemory(data || []);
    } catch (error) {
      console.error('[KB Browser] Load memory error:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const { data } = await supabase
        .from('rocker_conversations')
        .select('*')
        .eq('user_id', session?.userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      setConversations(data || []);
    } catch (error) {
      console.error('[KB Browser] Load conversations error:', error);
    }
  };

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

      if (scope === 'user') {
        // Filter by current user's tenant_id
        query = query.eq('scope', 'user').eq('tenant_id', session?.userId);
      } else if (scope !== 'all') {
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

  const addKnowledge = async () => {
    if (!newContent.trim() || !newUri.trim()) {
      toast.error('Content and URI are required');
      return;
    }

    setAdding(true);
    try {
      await ingestKnowledge(newContent, newUri, session?.userId);
      toast.success('Knowledge added successfully');
      setAddDialogOpen(false);
      setNewContent('');
      setNewUri('');
      searchKnowledge();
    } catch (error) {
      console.error('[KB Browser] Add error:', error);
      toast.error('Failed to add knowledge');
    } finally {
      setAdding(false);
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
      {/* What Rocker Knows About Me */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            What Rocker Knows About Me
          </CardTitle>
          <CardDescription>
            Your personal knowledge and learned preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Profile Card */}
          {userProfile && (
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{userProfile.display_name || userProfile.email}</div>
                  <div className="text-sm text-muted-foreground">{userProfile.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">User ID:</span>
                  <div className="font-mono text-xs mt-1 break-all">{userProfile.userId}</div>
                </div>
                {userProfile.bio && (
                  <div>
                    <span className="text-muted-foreground">Bio:</span>
                    <div className="mt-1">{userProfile.bio}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={() => {
                setScope('user');
                setCategory('all');
              }}
              variant={scope === 'user' ? 'default' : 'outline'}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              My Knowledge Files ({items.filter(i => i.scope === 'user' && i.tenant_id === session?.userId).length})
            </Button>
            <Button 
              onClick={() => setAddDialogOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Teach Rocker
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Learned Memories */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Learned From Conversations ({userMemory.length})</div>
              <ScrollArea className="h-[300px] border rounded p-2">
                {userMemory.length > 0 ? (
                  <div className="space-y-2">
                    {userMemory.map((mem) => (
                      <div key={mem.id} className="p-2 border rounded text-sm bg-card">
                        <div className="font-medium text-xs text-muted-foreground">{mem.type}</div>
                        <div className="mt-1">{mem.key.replace(/_/g, ' ')}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {typeof mem.value === 'object' && mem.value !== null 
                            ? JSON.stringify(mem.value).substring(0, 100) 
                            : String(mem.value).substring(0, 100)}...
                        </div>
                        <div className="flex gap-1 mt-2">
                          <Badge variant="secondary" className="text-xs">{mem.source}</Badge>
                          {mem.tags?.slice(0, 2).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No learnings yet. Chat with Rocker and it will automatically learn your preferences!
                  </p>
                )}
              </ScrollArea>
            </div>

            {/* Recent Conversations */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Recent Conversations ({conversations.length})</div>
              <ScrollArea className="h-[300px] border rounded p-2">
                {conversations.length > 0 ? (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <div key={conv.id} className="p-2 border rounded text-sm bg-card">
                        <div className="flex items-center gap-2">
                          <Badge variant={conv.role === 'user' ? 'default' : 'secondary'} className="text-xs">
                            {conv.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(conv.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-1 text-xs">{conv.content.substring(0, 150)}...</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No conversations yet. Start chatting with Rocker to see your conversation history!
                  </p>
                )}
              </ScrollArea>
            </div>
          </div>

          {userMemory.length === 0 && conversations.length === 0 && scope === 'user' && items.length === 0 && (
            <div className="text-center py-6 text-muted-foreground border-t">
              <p className="mb-2 font-medium">Rocker hasn't learned anything about you yet.</p>
              <p className="text-sm mb-4">Start chatting with Rocker or click "Teach Rocker" to add knowledge manually.</p>
              <p className="text-xs">💡 Rocker automatically learns from your conversations - try saying things like "I prefer...", "I always...", or "My favorite..."</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5" />
                Knowledge Browser
              </CardTitle>
              <CardDescription>
                Search, browse, and moderate all knowledge base content
              </CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Knowledge
            </Button>
          </div>
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
                  <div className="text-center py-8 space-y-2">
                    <p className="text-muted-foreground">
                      {scope === 'user' 
                        ? "No knowledge items found under your user scope. Click 'Add Knowledge' to teach Rocker about your preferences."
                        : scope === 'site'
                        ? "No site-wide knowledge items found."
                        : "No knowledge items found. Try adjusting your filters or search query."}
                    </p>
                    {scope === 'user' && (
                      <Button onClick={() => setAddDialogOpen(true)} variant="outline" size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Your First Knowledge Item
                      </Button>
                    )}
                  </div>
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

      {/* Add Knowledge Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Knowledge</DialogTitle>
            <DialogDescription>
              Add new knowledge for Rocker. Use YAML front-matter for metadata, followed by markdown content.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="uri">URI (unique identifier)</Label>
              <Input
                id="uri"
                placeholder="e.g., user/preferences/my-settings"
                value={newUri}
                onChange={(e) => setNewUri(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use format: scope/category/subcategory/title (e.g., user/preferences/notifications)
              </p>
            </div>

            <div>
              <Label htmlFor="content">Content (YAML + Markdown)</Label>
              <Textarea
                id="content"
                placeholder={`---
scope: user
category: preferences
subcategory: notifications
title: My Notification Settings
tags: [user-preference, notifications]
summary: My preferred notification settings
---

# My Notification Settings

I prefer to receive notifications via email, not SMS.
I want daily digest emails at 8am.`}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Start with YAML front-matter (between ---), then add markdown content
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addKnowledge} disabled={adding}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Knowledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
