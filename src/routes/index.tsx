import { Link } from 'react-router-dom';
import { SEOHelmet } from '@/lib/seo/helmet';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { useSession } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { SmartFeed } from '@/components/posts/SmartFeed';
import { CreatePost } from '@/components/posts/CreatePost';
import { UpcomingEventsRow } from '@/components/calendar/UpcomingEventsRow';
import { CreateModalRouter } from '@/components/modals/CreateModalRouter';
import { EventDetailModal } from '@/components/modals/EventDetailModal';
import { CartModal } from '@/components/modals/CartModal';
import { CheckoutModal } from '@/components/modals/CheckoutModal';
import { OrderSuccessModal } from '@/components/modals/OrderSuccessModal';
import { useState } from 'react';

export default function Index() {
  const { session } = useSession();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <SEOHelmet title="Home" description="yalls.ai - Connecting equestrian communities with profiles, events, and marketplace" />
      <GlobalHeader />
      <CreateModalRouter />
      <EventDetailModal />
      <CartModal />
      <CheckoutModal />
      <OrderSuccessModal />
      
      <main className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 py-8">
            <h1 className="text-4xl font-bold">yalls.ai</h1>
            <p className="text-lg text-muted-foreground">
              Equestrian community platform
            </p>
            {!session && (
              <div className="flex gap-3 justify-center mt-4">
                <Link to="/login">
                  <Button size="lg">Get Started</Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">Sign In</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Feed Section */}
          {session && (
            <div className="mt-4 space-y-6">
              <CreatePost onPostCreated={() => setRefreshKey(prev => prev + 1)} />
              <UpcomingEventsRow />
              <SmartFeed key={refreshKey} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
