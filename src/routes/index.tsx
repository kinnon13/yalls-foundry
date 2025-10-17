import { Link, useSearchParams } from 'react-router-dom';
import { SEOHelmet } from '@/lib/seo/helmet';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { useSession } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatePost } from '@/components/posts/CreatePost';
import { PublicCalendar } from '@/components/calendar/PublicCalendar';
import { TikTokScroller } from '@/components/reels/TikTokScroller';
import { useScrollerFeed } from '@/hooks/useScrollerFeed';
import { CreateModalRouter } from '@/components/modals/CreateModalRouter';
import { EventDetailModal } from '@/components/modals/EventDetailModal';
import { CartModal } from '@/components/modals/CartModal';
import { CheckoutModal } from '@/components/modals/CheckoutModal';
import { OrderSuccessModal } from '@/components/modals/OrderSuccessModal';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Users, Star, TrendingUp, ShoppingCart } from 'lucide-react';
import type { FeedMode } from '@/types/feed';

export default function Index() {
  const { session } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get lane from URL (default: for_you)
  const lane = (searchParams.get('lane') || 'for_you') as 'for_you' | 'following' | 'shop';
  
  // Map lane to feed mode
  const feedMode: FeedMode = lane === 'following' ? 'personal' : 'combined';

  // Feed data
  const { 
    data: feedData,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useScrollerFeed({ mode: feedMode, pageSize: 20 });

  const allItems = feedData?.pages.flatMap((page) => page.items) || [];

  // Fetch featured content for non-logged-in users
  const { data: featuredEvents = [] } = useQuery({
    queryKey: ['featured-events'],
    queryFn: async () => {
      const { data } = await supabase
        .from('events' as any)
        .select('*')
        .order('starts_at', { ascending: true })
        .limit(3);
      return data || [];
    },
    enabled: !session
  });

  const handleLaneChange = (newLane: string) => {
    setSearchParams({ lane: newLane });
  };

  return (
    <>
      <SEOHelmet title="Y'alls.ai - Your Rodeo & Farm Platform" description="The ultimate platform for rodeo events, farm operations, and equestrian marketplace" />
      <GlobalHeader />
      <CreateModalRouter />
      <EventDetailModal />
      <CartModal />
      <CheckoutModal />
      <OrderSuccessModal />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        {!session && (
          <section className="relative bg-gradient-to-b from-primary/10 to-background py-20">
            <div className="container mx-auto px-4 text-center">
              <Badge variant="outline" className="mb-4">
                <TrendingUp className="h-3 w-3 mr-1" />
                Platform Launch 2025
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Welcome to Y'alls.ai
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                The complete platform for rodeo events, farm operations, stallion breeding, and equestrian marketplace.
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/login">
                  <Button size="lg">Get Started</Button>
                </Link>
                <Link to="/discover">
                  <Button size="lg" variant="outline">Explore Marketplace</Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Features Grid for New Users */}
        {!session && (
          <section className="container mx-auto px-4 py-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Platform Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link to="/events">
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Calendar className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>Rodeo Events</CardTitle>
                    <CardDescription>
                      Browse, enter, and manage rodeo competitions
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/farm/dashboard">
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Users className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>Farm Operations</CardTitle>
                    <CardDescription>
                      Manage horses, boarders, and barn tasks
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/stallions">
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Star className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>Stallion Directory</CardTitle>
                    <CardDescription>
                      Browse breeding stallions and manage offspring
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/discover">
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <ShoppingCart className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>Marketplace</CardTitle>
                    <CardDescription>
                      Buy and sell horses, tack, and equipment
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </section>
        )}

        {/* Feed Section for Logged-in Users */}
        {session && (
          <div className="flex gap-6 max-w-7xl mx-auto p-6">
            {/* Main Feed Column */}
            <div className="flex-1 space-y-4">
              {/* Composer */}
              <CreatePost onPostCreated={() => setRefreshKey((prev) => prev + 1)} />

              {/* Lane Tabs */}
              <Tabs value={lane} onValueChange={handleLaneChange} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="for_you">For You</TabsTrigger>
                  <TabsTrigger value="following">Following</TabsTrigger>
                  <TabsTrigger value="shop">Shop</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* TikTok Scroller */}
              <TikTokScroller
                items={allItems}
                isLoading={isLoading || isFetchingNextPage}
                hasMore={hasNextPage}
                onLoadMore={fetchNextPage}
                onItemView={(item) => {
                  // Log view event (already handled in useScrollerFeed)
                  console.log('[Feed] Viewed item:', item.kind, item.id);
                }}
              />
            </div>

            {/* Right Sidebar - Public Calendar */}
            <div className="hidden lg:block w-80 shrink-0">
              <div className="sticky top-20">
                <PublicCalendar />
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
