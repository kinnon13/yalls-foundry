import { Link } from 'react-router-dom';
import { SEOHelmet } from '@/lib/seo/helmet';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { useSession } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SmartFeed } from '@/components/posts/SmartFeed';
import { CreatePost } from '@/components/posts/CreatePost';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Index() {
  const { session } = useSession();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showRockerLabels, setShowRockerLabels] = useState(false);

  return (
    <>
      <SEOHelmet title="Home" description="yalls.ai - Connecting equestrian communities with profiles, events, and marketplace" />
      <GlobalHeader showRockerLabels={showRockerLabels} />
      
      {/* Rocker Label Toggle */}
      <Button
        onClick={() => setShowRockerLabels(!showRockerLabels)}
        className="fixed top-20 right-4 z-50 gap-2 shadow-lg pointer-events-auto"
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
            <Badge className="fixed top-32 right-4 z-40 bg-primary/90 pointer-events-none">
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
                    <Badge className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 pointer-events-none">
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
                    <Badge className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary/90 pointer-events-none">
                      "sign in login homepage"
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Feed Section */}
          {session && (
            <div className="mt-4 space-y-6" data-rocker="community feed section">
              <CreatePost 
                onPostCreated={() => setRefreshKey(prev => prev + 1)} 
                showRockerLabels={showRockerLabels}
              />
              
              <SmartFeed key={refreshKey} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
