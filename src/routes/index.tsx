import { Link } from 'react-router-dom';
import { SEOHelmet } from '@/lib/seo/helmet';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { useSession } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TikTokFeed } from '@/components/posts/TikTokFeed';
import { TwitterFeed } from '@/components/posts/TwitterFeed';
import { LiveFeed } from '@/components/posts/LiveFeed';
import { CreatePost } from '@/components/posts/CreatePost';
import { VoicePostButton } from '@/components/voice/VoicePostButton';
import { useState } from 'react';
import { Video, MessageCircle, Radio } from 'lucide-react';

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
          <div className="text-center space-y-4 py-8">
            <h1 className="text-4xl font-bold">yalls.ai</h1>
            <p className="text-lg text-muted-foreground">
              Equestrian community platform
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

          {/* Feed Tabs */}
          {session && (
            <div className="mt-4 space-y-6" data-rocker="community feed section">
              <div className="space-y-4">
                <CreatePost onPostCreated={() => setRefreshKey(prev => prev + 1)} />
                <VoicePostButton onPostCreated={() => setRefreshKey(prev => prev + 1)} />
              </div>
              
              <Tabs defaultValue="media" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="media" className="gap-2" data-rocker="feed media tab">
                    <Video className="h-4 w-4" />
                    Media
                  </TabsTrigger>
                  <TabsTrigger value="text" className="gap-2" data-rocker="feed posts tab">
                    <MessageCircle className="h-4 w-4" />
                    Posts
                  </TabsTrigger>
                  <TabsTrigger value="live" className="gap-2" data-rocker="feed live tab">
                    <Radio className="h-4 w-4" />
                    Live
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="media" className="mt-6">
                  <TikTokFeed key={refreshKey} />
                </TabsContent>
                
                <TabsContent value="text" className="mt-6">
                  <TwitterFeed key={refreshKey} />
                </TabsContent>
                
                <TabsContent value="live" className="mt-6">
                  <LiveFeed />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
