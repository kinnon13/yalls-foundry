/**
 * Discover Page - Mixed feed with ReelCards & ListingCards
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { ReelCard } from '@/design/components/ReelCard';
import { FacetBar, FacetGroup } from '@/design/components/FacetBar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Discover() {
  const [activeTab, setActiveTab] = useState('for-you');
  const [facets, setFacets] = useState<Record<string, any>>({});

  // Fetch listings
  const { data: listings = [] } = useQuery({
    queryKey: ['discover-listings', activeTab, facets],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_listings' as any)
        .select('*')
        .eq('status', 'active');

      // Apply price filter
      if (facets.price) {
        query = query.gte('price_cents', facets.price[0] * 100);
        query = query.lte('price_cents', facets.price[1] * 100);
      }

      const { data } = await query.order('created_at', { ascending: false }).limit(20);
      return data || [];
    },
  });

  // Fetch posts for reel cards
  const { data: posts = [] } = useQuery({
    queryKey: ['discover-posts', activeTab],
    queryFn: async () => {
      const { data } = await supabase
        .from('posts' as any)
        .select('*, profiles!posts_author_user_id_fkey(display_name, avatar_url)')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  // Facet groups configuration
  const facetGroups: FacetGroup[] = [
    {
      id: 'price',
      label: 'Price Range',
      type: 'range',
      range: { min: 0, max: 50000, step: 100 },
    },
    {
      id: 'category',
      label: 'Category',
      type: 'checkbox',
      options: [
        { value: 'horses', label: 'Horses', count: 45 },
        { value: 'tack', label: 'Tack & Equipment', count: 120 },
        { value: 'trailers', label: 'Trailers', count: 23 },
        { value: 'services', label: 'Services', count: 67 },
      ],
    },
  ];

  const handleFacetChange = (facetId: string, value: any) => {
    setFacets((prev) => ({
      ...prev,
      [facetId]: value,
    }));
  };

  const handleResetFacets = () => {
    setFacets({});
  };

  // Mix reels and listings for feed
  const mixedFeed = [];
  let postIndex = 0;
  let listingIndex = 0;

  // Interleave posts and listings (1 reel per 3 listings)
  while (postIndex < posts.length || listingIndex < listings.length) {
    // Add 3 listings
    for (let i = 0; i < 3 && listingIndex < listings.length; i++) {
      mixedFeed.push({ type: 'listing', data: listings[listingIndex++] });
    }
    // Add 1 reel
    if (postIndex < posts.length) {
      mixedFeed.push({ type: 'reel', data: posts[postIndex++] });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Discover</h1>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar Facets */}
          <div className="hidden lg:block">
            <FacetBar
              groups={facetGroups}
              values={facets}
              onChange={handleFacetChange}
              onReset={handleResetFacets}
            />
          </div>

          {/* Main Content */}
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList>
                <TabsTrigger value="for-you">For You</TabsTrigger>
                <TabsTrigger value="trending">Trending</TabsTrigger>
                <TabsTrigger value="latest">Latest</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {mixedFeed.map((item, idx) => {
                    if (item.type === 'reel') {
                      const post = item.data as any;
                      return (
                        <ReelCard
                          key={`reel-${post.id}`}
                          media={
                            post.media?.[0]?.url ? (
                              <img
                                src={post.media[0].url}
                                alt={post.body}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                <p className="text-muted-foreground">No media</p>
                              </div>
                            )
                          }
                          title={post.body?.slice(0, 50) || 'Post'}
                          author={
                            <div className="flex items-center gap-2">
                              {post.profiles?.avatar_url && (
                                <img
                                  src={post.profiles.avatar_url}
                                  alt={post.profiles.display_name}
                                  className="w-6 h-6 rounded-full"
                                />
                              )}
                              <span className="text-sm text-white">
                                {post.profiles?.display_name || 'Anonymous'}
                              </span>
                            </div>
                          }
                          onLike={() => {}}
                          onComment={() => {}}
                          onShare={() => {}}
                        />
                      );
                    } else {
                      const listing = item.data as any;
                      return (
                        <Link key={`listing-${listing.id}`} to={`/listings/${listing.id}`}>
                          <Card className="h-full hover:shadow-lg transition-shadow">
                            <CardContent className="p-0">
                              {listing.media?.[0]?.url ? (
                                <img
                                  src={listing.media[0].url}
                                  alt={listing.title}
                                  className="w-full h-48 object-cover rounded-t-lg"
                                />
                              ) : (
                                <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                                  No image
                                </div>
                              )}
                              
                              <div className="p-4">
                                <h3 className="font-semibold mb-2 line-clamp-1">
                                  {listing.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {listing.description}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                  <div className="text-xl font-bold text-primary">
                                    ${(listing.price_cents / 100).toFixed(2)}
                                  </div>
                                  <Button size="sm" variant="outline">
                                    <ShoppingCart className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                {listing.stock_quantity <= 5 && (
                                  <Badge variant="destructive" className="mt-2">
                                    Only {listing.stock_quantity} left
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    }
                  })}
                </div>

                {mixedFeed.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No items found. Adjust your filters or check back later.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
