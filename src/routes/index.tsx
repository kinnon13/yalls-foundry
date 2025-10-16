import { Link } from 'react-router-dom';
import { SEOHelmet } from '@/lib/seo/helmet';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { useSession } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { PostFeed } from '@/components/posts/PostFeed';
import { CreatePost } from '@/components/posts/CreatePost';
import { useState } from 'react';

export default function Index() {
  const { session } = useSession();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <SEOHelmet title="Home" description="yalls.ai - Connecting equestrian communities with profiles, events, and marketplace" />
      <GlobalHeader />
      <main className="min-h-screen p-6" data-rocker="homepage main feed">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 py-12">
            <h1 className="text-5xl font-bold">yalls.ai</h1>
            <p className="text-xl text-muted-foreground">
              Equestrian community platform - Horses, Events, Marketplace
            </p>
            {!session && (
              <div className="flex gap-3 justify-center mt-4">
                <Link to="/signup">
                  <Button size="lg" data-rocker="sign up homepage" aria-label="Get Started">Get Started</Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" data-rocker="sign in login homepage" aria-label="Sign In">Sign In</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Community Feed */}
          {session && (
            <div className="mt-8 space-y-6" data-rocker="community feed section">
              <h2 className="text-2xl font-bold">Community Feed</h2>
              <CreatePost onPostCreated={() => setRefreshKey(prev => prev + 1)} />
              <PostFeed key={refreshKey} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
