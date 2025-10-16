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
import { useState } from 'react';
import { Video, MessageCircle, Radio, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Index() {
  const { session } = useSession();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showRockerLabels, setShowRockerLabels] = useState(false);

  return (
    <>
      <SEOHelmet title="Home" description="yalls.ai - Connecting equestrian communities with profiles, events, and marketplace" />
      <GlobalHeader />
      
      {/* Rocker Label Toggle */}
      <Button
        onClick={() => setShowRockerLabels(!showRockerLabels)}
        className="fixed top-20 right-4 z-50 gap-2 shadow-lg"
        variant={showRockerLabels ? "default" : "outline"}
        size="sm"
      >
        {showRockerLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        {showRockerLabels ? 'Hide' : 'Show'} Rocker Labels
      </Button>
      
      <main className="min-h-screen p-6" data-rocker="homepage main feed">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Main container label */}
          {showRockerLabels && (
            <Badge className="fixed top-32 right-4 z-50 bg-primary/90">
              Main: "homepage main feed"
            </Badge>
          )}
          
          {/* Header */}
          <div className="text-center space-y-4 py-8">
            <h1 className="text-4xl font-bold">yalls.ai</h1>
            <p className="text-lg text-muted-foreground">
              Equestrian community platform
            </p>
            {!session && (
              <div className="flex gap-3 justify-center mt-4">
                <div className="relative">
                  <Link to="/signup">
                    <Button 
                      size="lg" 
                      data-rocker="sign up homepage" 
                      aria-label="Get Started"
                      className={showRockerLabels ? "ring-2 ring-primary ring-offset-2" : ""}
                    >
                      Get Started
                    </Button>
                  </Link>
                  {showRockerLabels && (
                    <Badge className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90">
                      "sign up homepage"
                    </Badge>
                  )}
                </div>
                
                <div className="relative">
                  <Link to="/login">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      data-rocker="sign in login homepage" 
                      aria-label="Sign In"
                      className={showRockerLabels ? "ring-2 ring-primary ring-offset-2" : ""}
                    >
                      Sign In
                    </Button>
                  </Link>
                  {showRockerLabels && (
                    <Badge className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90">
                      "sign in login homepage"
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Feed Tabs */}
          {session && (
            <div className="mt-4 space-y-6" data-rocker="community feed section">
              {showRockerLabels && (
                <Badge className="mb-2 bg-secondary/90">
                  Section: "community feed section"
                </Badge>
              )}
              
              <CreatePost 
                onPostCreated={() => setRefreshKey(prev => prev + 1)} 
                showRockerLabels={showRockerLabels}
              />
              
              <Tabs defaultValue="media" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <div className="relative">
                    <TabsTrigger 
                      value="media" 
                      className={`gap-2 ${showRockerLabels ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      data-rocker="feed media tab"
                    >
                      <Video className="h-4 w-4" />
                      Media
                    </TabsTrigger>
                    {showRockerLabels && (
                      <Badge className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 text-xs">
                        "feed media tab"
                      </Badge>
                    )}
                  </div>
                  
                  <div className="relative">
                    <TabsTrigger 
                      value="text" 
                      className={`gap-2 ${showRockerLabels ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      data-rocker="feed posts tab"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Posts
                    </TabsTrigger>
                    {showRockerLabels && (
                      <Badge className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 text-xs">
                        "feed posts tab"
                      </Badge>
                    )}
                  </div>
                  
                  <div className="relative">
                    <TabsTrigger 
                      value="live" 
                      className={`gap-2 ${showRockerLabels ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      data-rocker="feed live tab"
                    >
                      <Radio className="h-4 w-4" />
                      Live
                    </TabsTrigger>
                    {showRockerLabels && (
                      <Badge className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 text-xs">
                        "feed live tab"
                      </Badge>
                    )}
                  </div>
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
