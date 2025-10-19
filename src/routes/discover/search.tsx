/**
 * Global Search - TikTok-style search
 * Search across users, videos, products, sounds, hashtags
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, User, Video, Package, Hash, Music, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type SearchTab = 'all' | 'users' | 'videos' | 'products' | 'hashtags' | 'sounds';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');

  // Search users
  const { data: users = [] } = useQuery({
    queryKey: ['search-users', query],
    queryFn: async () => {
      if (!query) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, handle')
        .ilike('display_name', `%${query}%`)
        .limit(20);
      return data || [];
    },
    enabled: !!query && (activeTab === 'all' || activeTab === 'users'),
  });

  // Search posts/videos
  const { data: posts = [] } = useQuery({
    queryKey: ['search-posts', query],
    queryFn: async () => {
      if (!query) return [];
      const { data } = await supabase
        .from('posts')
        .select(`
          id,
          caption,
          media_url,
          thumbnail_url,
          created_at,
          profiles:user_id(id, display_name, avatar_url)
        `)
        .ilike('caption', `%${query}%`)
        .limit(20);
      return data || [];
    },
    enabled: !!query && (activeTab === 'all' || activeTab === 'videos'),
  });

  // Search products
  const { data: products = [] } = useQuery({
    queryKey: ['search-products', query],
    queryFn: async () => {
      if (!query) return [];
      const { data } = await supabase
        .from('marketplace_listings')
        .select('id, title, description, price, images')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('status', 'active')
        .limit(20);
      return data || [];
    },
    enabled: !!query && (activeTab === 'all' || activeTab === 'products'),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Search Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="container max-w-2xl mx-auto px-4 py-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users, videos, products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 pr-10 h-11 bg-muted/50"
              autoFocus
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {!query ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Search for users, videos, or products</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SearchTab)}>
            <TabsList className="w-full justify-start mb-6 overflow-x-auto">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                All
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Users ({users.length})
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Videos ({posts.length})
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Products ({products.length})
              </TabsTrigger>
            </TabsList>

            {/* All Results */}
            <TabsContent value="all" className="space-y-6">
              {users.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Users
                  </h3>
                  <div className="space-y-2">
                    {users.slice(0, 3).map((user: any) => (
                      <UserResult key={user.id} user={user} />
                    ))}
                  </div>
                </div>
              )}

              {posts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Videos
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {posts.slice(0, 6).map((post: any) => (
                      <PostResult key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              )}

              {products.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Products
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {products.slice(0, 4).map((product: any) => (
                      <ProductResult key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}

              {users.length === 0 && posts.length === 0 && products.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No results found for "{query}"</p>
                </div>
              )}
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-2">
              {users.map((user: any) => (
                <UserResult key={user.id} user={user} />
              ))}
              {users.length === 0 && (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No users found</p>
                </div>
              )}
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos">
              <div className="grid grid-cols-3 gap-2">
                {posts.map((post: any) => (
                  <PostResult key={post.id} post={post} />
                ))}
              </div>
              {posts.length === 0 && (
                <div className="text-center py-12">
                  <Video className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No videos found</p>
                </div>
              )}
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              <div className="grid grid-cols-2 gap-3">
                {products.map((product: any) => (
                  <ProductResult key={product.id} product={product} />
                ))}
              </div>
              {products.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No products found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function UserResult({ user }: { user: any }) {
  return (
    <a
      href={`/?feed=profile&user=${user.id}`}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <Avatar className="h-12 w-12">
        <AvatarImage src={user.avatar_url} />
        <AvatarFallback>{user.display_name?.[0] || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{user.display_name || 'Unknown'}</p>
        {user.handle && (
          <p className="text-xs text-muted-foreground truncate">@{user.handle}</p>
        )}
      </div>
      <Button size="sm" variant="outline">Follow</Button>
    </a>
  );
}

function PostResult({ post }: { post: any }) {
  return (
    <a
      href={`/?feed=for-you&post=${post.id}`}
      className="aspect-[9/16] rounded-lg overflow-hidden bg-muted relative group"
    >
      {post.thumbnail_url || post.media_url ? (
        <img
          src={post.thumbnail_url || post.media_url}
          alt={post.caption || 'Post'}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Video className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="absolute bottom-2 left-2 right-2 text-white text-xs line-clamp-2">
          {post.caption}
        </p>
      </div>
    </a>
  );
}

function ProductResult({ product }: { product: any }) {
  const image = product.images?.[0];
  return (
    <a
      href={`/listings/${product.id}`}
      className="group"
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-square bg-muted">
          {image ? (
            <img
              src={image}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="font-semibold text-sm line-clamp-2 mb-1">{product.title}</p>
          <p className="text-primary font-bold">${product.price}</p>
        </div>
      </Card>
    </a>
  );
}
