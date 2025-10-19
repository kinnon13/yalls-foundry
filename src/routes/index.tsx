import { Link, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { SEOHelmet } from '@/lib/seo/helmet';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { useSession } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreatePost } from '@/components/posts/CreatePost';
import { PublicCalendarWidget } from '@/components/feed/PublicCalendarWidget';
import { TikTokScroller } from '@/components/feed/TikTokScroller';
import { useScrollerFeed } from '@/hooks/useScrollerFeed';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { CreateModalRouter } from '@/components/modals/CreateModalRouter';
import { EventDetailModal } from '@/components/modals/EventDetailModal';
import { CartModal } from '@/components/modals/CartModal';
import { CheckoutModal } from '@/components/modals/CheckoutModal';
import { OrderSuccessModal } from '@/components/modals/OrderSuccessModal';
import { Sparkles, Users, ShoppingCart, TrendingUp, Heart, Zap } from 'lucide-react';

type Lane = 'personal' | 'combined';

export default function Index() {
  const { session } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const laneParam = searchParams.get('lane') || 'personal';
  const lane = (laneParam === 'following' ? 'combined' : 'personal') as Lane;

  const { 
    data,
    isLoading,
    hasNextPage,
    fetchNextPage
  } = useScrollerFeed({ lane });

  const items = useMemo(() => (data?.pages ?? []).flatMap(p => p.items), [data]);

  return (
    <>
      <SEOHelmet title="Y'alls.ai - Your Rodeo & Farm Platform" description="The ultimate platform for rodeo events, farm operations, and equestrian marketplace" />
      <GlobalHeader />
      <CreateModalRouter />
      <EventDetailModal />
      <CartModal />
      <CheckoutModal />
      <OrderSuccessModal />
      
      <main className="min-h-screen pt-20">
        {!session ? (
          <>
            {/* Hero Section */}
            <section className="relative bg-gradient-to-b from-primary/10 to-background py-20">
              <div className="container mx-auto px-4 text-center">
                <h1 className="text-5xl md:text-6xl font-bold mb-6">
                  Welcome to <span className="text-primary">Y'alls.ai</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  The equestrian social network powered by AI. Connect, compete, and grow your business.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button size="lg" asChild>
                    <Link to="/login">Get Started</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/discover">Explore</Link>
                  </Button>
                </div>
              </div>
            </section>

            {/* Feature Cards */}
            <section className="container mx-auto px-4 py-16">
              <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                <Card>
                  <CardHeader>
                    <Sparkles className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>AI-Powered</CardTitle>
                    <CardDescription>Smart recommendations and automated tools</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <Users className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>Community First</CardTitle>
                    <CardDescription>Connect with riders, trainers, and businesses</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <ShoppingCart className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>Marketplace</CardTitle>
                    <CardDescription>Buy, sell, and discover</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </section>
          </>
        ) : (
          <div className="container mx-auto px-4 pb-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                <CreatePost onPostCreated={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
                
                <SegmentedControl
                  value={lane}
                  onChange={(value) => setSearchParams({ lane: value })}
                  options={[
                    { value: 'for_you', label: 'For You', icon: <Sparkles className="h-4 w-4" /> },
                    { value: 'following', label: 'Following', icon: <Heart className="h-4 w-4" /> },
                    { value: 'shop', label: 'Shop', icon: <ShoppingCart className="h-4 w-4" /> }
                  ]}
                  className="w-full sm:w-auto"
                />

          <TikTokScroller
            items={items}
            isLoading={isLoading}
            lane={lane}
            onLoadMore={fetchNextPage}
            hasNextPage={hasNextPage}
          />
              </div>

              <div className="lg:col-span-4 space-y-4">
                <PublicCalendarWidget />
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
