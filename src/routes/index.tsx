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
import { Video, MessageCircle, Radio, BarChart3, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Index() {
  const { session } = useSession();
  const [refreshKey, setRefreshKey] = useState(0);
  const { isAdmin } = useAdminCheck();
  const [showGuide, setShowGuide] = useState(true);

  const navigationFeatures = [
    {
      category: "Authentication (Logged Out)",
      items: [
        {
          name: "Get Started Button",
          action: "Navigate to /signup",
          rockerId: "sign up homepage",
          description: "Creates new user account"
        },
        {
          name: "Sign In Button",
          action: "Navigate to /login",
          rockerId: "sign in login homepage",
          description: "Access existing account"
        }
      ]
    },
    {
      category: "Admin Features (Admin Only)",
      items: [
        {
          name: "Learning Dashboard",
          action: "Navigate to /admin/learning",
          rockerId: "learning dashboard link",
          description: "View AI learning outcomes, selector memory, and failure analytics"
        }
      ]
    },
    {
      category: "Feed Controls (Logged In)",
      items: [
        {
          name: "Create Post",
          action: "Open post composer",
          rockerId: "post field",
          description: "Write and submit new posts to the community"
        },
        {
          name: "Media Tab",
          action: "Switch to media feed",
          rockerId: "feed media tab",
          description: "View TikTok-style video and image posts"
        },
        {
          name: "Posts Tab",
          action: "Switch to text feed",
          rockerId: "feed posts tab",
          description: "View Twitter-style text posts"
        },
        {
          name: "Live Tab",
          action: "Switch to live feed",
          rockerId: "feed live tab",
          description: "View real-time live streams and updates"
        }
      ]
    }
  ];

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
            {isAdmin && (
              <div className="mt-4">
                <Link to="/admin/learning">
                  <Button variant="outline" size="sm" className="gap-2" data-rocker="learning dashboard link">
                    <BarChart3 className="h-4 w-4" />
                    Learning Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Rocker Navigation Guide */}
          <Card className="border-primary/20 bg-muted/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <CardTitle>Rocker Navigation Guide</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGuide(!showGuide)}
                  className="gap-1"
                >
                  {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {showGuide ? 'Hide' : 'Show'}
                </Button>
              </div>
              <CardDescription>
                All interactive elements on this page and how Rocker AI can control them
              </CardDescription>
            </CardHeader>
            
            {showGuide && (
              <CardContent className="space-y-6">
                {navigationFeatures.map((section, idx) => (
                  <div key={idx} className="space-y-3">
                    <h3 className="text-sm font-semibold text-primary border-b pb-2">
                      {section.category}
                    </h3>
                    <div className="grid gap-3">
                      {section.items.map((item, itemIdx) => (
                        <div 
                          key={itemIdx} 
                          className="p-3 rounded-lg border bg-background/50 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.description}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 pt-2 border-t">
                            <Badge variant="outline" className="gap-1">
                              <span className="text-xs text-muted-foreground">Action:</span>
                              <span className="text-xs">{item.action}</span>
                            </Badge>
                            <Badge variant="secondary" className="gap-1 font-mono">
                              <span className="text-xs text-muted-foreground">Rocker ID:</span>
                              <span className="text-xs">{item.rockerId}</span>
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                            <strong>Rocker Command Example:</strong> "Click {item.rockerId}" or "Navigate to {item.name}"
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    How Rocker Works
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Each element has a <code className="bg-muted px-1 rounded">data-rocker</code> attribute</li>
                    <li>Rocker uses these IDs to find and interact with elements</li>
                    <li>When Rocker succeeds, it learns and stores the selector for future use</li>
                    <li>When Rocker fails, it logs the failure to the Learning Dashboard</li>
                    <li>Admin can view all learning data at <Link to="/admin/learning" className="text-primary hover:underline">/admin/learning</Link></li>
                  </ul>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Feed Tabs */}
          {session && (
            <div className="mt-4 space-y-6" data-rocker="community feed section">
              <CreatePost onPostCreated={() => setRefreshKey(prev => prev + 1)} />
              
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
