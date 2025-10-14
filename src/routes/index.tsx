import { Link } from 'react-router-dom';
import { SEOHelmet } from '@/lib/seo/helmet';
import { DevNav } from '@/components/DevNav';
import { useSession } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Search, Settings } from 'lucide-react';

export default function Index() {
  const { session } = useSession();

  return (
    <>
      <SEOHelmet title="Home" description="yalls.ai - Connecting equestrian communities with profiles, events, and marketplace" />
      <DevNav />
      <main className="min-h-screen p-6">
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
                    <Button variant="outline" size="sm">Sign Out</Button>
                  </Link>
                </div>
              ) : (
                <Link to="/login">
                  <Button>Sign In</Button>
                </Link>
              )}
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="grid gap-6 md:grid-cols-3">
            <Link to="/horses">
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
                  <Button variant="outline" className="w-full">
                    Browse Horses
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link to="/search">
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
                  <Button variant="outline" className="w-full">
                    Search Registry
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/control-room">
              <Card className="hover:border-primary transition-colors h-full cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Control Room
                  </CardTitle>
                  <CardDescription>
                    Admin dashboard - Security, tests, diagnostics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Open Dashboard
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
        </div>
      </main>
    </>
  );
}