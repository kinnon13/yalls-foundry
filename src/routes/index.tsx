import { Link } from 'react-router-dom';
import { SEOHelmet } from '@/lib/seo/helmet';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { useSession } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Search, Settings, ShoppingBag, Bookmark, Building2 } from 'lucide-react';
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
            <div className="flex gap-3 justify-center">
              {session ? (
                <div className="text-sm flex items-center gap-3">
                  <span className="text-muted-foreground">
                    Signed in as <span className="font-medium">{session.email}</span> ({session.role})
                  </span>
                  <Link to="/login">
                    <Button variant="outline" size="sm" data-rocker="sign out logout homepage" aria-label="Sign Out">Sign Out</Button>
                  </Link>
                </div>
              ) : (
                <Link to="/login">
                  <Button data-rocker="sign in login homepage" aria-label="Sign In">Sign In</Button>
                </Link>
              )}
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="grid gap-6 md:grid-cols-3">
            {session && (
              <Link to="/dashboard" data-rocker="dashboard link card">
                <Card className="hover:border-primary transition-colors h-full cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Dashboard
                    </CardTitle>
                    <CardDescription>
                      View all your account connections and analytics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" data-rocker="go to dashboard button" aria-label="Go to Dashboard">
                      Go to Dashboard
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )}
            {session && (
              <Link to="/posts/saved" data-rocker="saved posts link card">
                <Card className="hover:border-primary transition-colors h-full cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bookmark className="h-5 w-5" />
                      Saved Posts
                    </CardTitle>
                    <CardDescription>
                      View your bookmarked content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" data-rocker="view saved posts button" aria-label="View Saved Posts">
                      View Saved
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )}

            <Link to="/horses" data-rocker="horses link card browse">
              <Card className="hover:border-primary transition-colors h-full cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Horses
                  </CardTitle>
                  <CardDescription>
                    Browse horse profiles, stallions, and breeding records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" data-rocker="browse horses button" aria-label="Browse Horses">
                    Browse Horses
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link to="/marketplace" data-rocker="marketplace link card shop">
              <Card className="hover:border-primary transition-colors h-full cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Marketplace
                  </CardTitle>
                  <CardDescription>
                    Browse and purchase products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" data-rocker="shop now marketplace button" aria-label="Shop Now">
                    Shop Now
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link to="/search" data-rocker="search link card find">
              <Card className="hover:border-primary transition-colors h-full cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Search
                  </CardTitle>
                  <CardDescription>
                    Find horses, farms, businesses, and events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" data-rocker="search registry button find" aria-label="Search Registry">
                    Search Registry
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Stats */}
          {session && (
            <Card>
              <CardHeader>
                <CardTitle>Platform Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold">✓</div>
                    <div className="text-xs text-muted-foreground">Auth Live</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold">✓</div>
                    <div className="text-xs text-muted-foreground">RLS Enabled</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold">✓</div>
                    <div className="text-xs text-muted-foreground">Partitioned DB</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold">✓</div>
                    <div className="text-xs text-muted-foreground">HNSW Index</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
