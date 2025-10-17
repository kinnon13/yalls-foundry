import { Link } from 'react-router-dom';
import { SEOHelmet } from '@/lib/seo/helmet';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { useSession } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SmartFeed } from '@/components/posts/SmartFeed';
import { CreatePost } from '@/components/posts/CreatePost';
import { UpcomingEventsRow } from '@/components/calendar/UpcomingEventsRow';
import { CreateModalRouter } from '@/components/modals/CreateModalRouter';
import { EventDetailModal } from '@/components/modals/EventDetailModal';
import { CartModal } from '@/components/modals/CartModal';
import { CheckoutModal } from '@/components/modals/CheckoutModal';
import { OrderSuccessModal } from '@/components/modals/OrderSuccessModal';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Trophy, Users, Star, TrendingUp, ShoppingCart } from 'lucide-react';

export default function Index() {
  const { session } = useSession();
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch featured content
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
  });

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
          <div className="max-w-6xl mx-auto p-6 space-y-6">
            <CreatePost onPostCreated={() => setRefreshKey(prev => prev + 1)} />
            <UpcomingEventsRow />
            <SmartFeed key={refreshKey} />
          </div>
        )}
      </main>
    </>
  );
}
