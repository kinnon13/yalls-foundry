/**
 * App Store - Discover and Install Features
 * Users can browse and add apps/features to their Home and workspaces
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SEOHelmet } from '@/lib/seo/helmet';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Users, 
  Sparkles,
  Calendar,
  Trophy,
  ShoppingBag,
  BarChart3,
  Search,
  Plus,
  Check
} from 'lucide-react';

type App = {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'communication' | 'business' | 'equestrian' | 'productivity';
  installed?: boolean;
  route: string;
};

const AVAILABLE_APPS: App[] = [
  {
    id: 'messages',
    name: 'Messages',
    description: 'Direct messaging and conversations',
    icon: MessageSquare,
    category: 'communication',
    route: '/messages',
  },
  {
    id: 'crm',
    name: 'CRM',
    description: 'Customer relationship management',
    icon: Users,
    category: 'business',
    route: '/crm',
  },
  {
    id: 'horses',
    name: 'Horses',
    description: 'Manage your horses and profiles',
    icon: Sparkles,
    category: 'equestrian',
    route: '/entities',
  },
  {
    id: 'events',
    name: 'Events',
    description: 'Rodeo and equestrian event management',
    icon: Trophy,
    category: 'equestrian',
    route: '/events',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Schedule and track activities',
    icon: Calendar,
    category: 'productivity',
    route: '/farm/calendar',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Business insights and metrics',
    icon: BarChart3,
    category: 'business',
    route: '/dashboard',
  },
];

export default function AppStore() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [installedApps, setInstalledApps] = useState<Set<string>>(new Set());

  const filteredApps = AVAILABLE_APPS.filter(app =>
    !searchQuery || 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(AVAILABLE_APPS.map(a => a.category)));

  const handleInstall = (appId: string) => {
    setInstalledApps(prev => new Set([...prev, appId]));
  };

  const handleUninstall = (appId: string) => {
    setInstalledApps(prev => {
      const next = new Set(prev);
      next.delete(appId);
      return next;
    });
  };

  const handleLaunch = (route: string) => {
    navigate(route);
  };

  return (
    <>
      <SEOHelmet
        title="App Store"
        description="Discover and add apps to your Home and workspaces"
      />
      
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">App Store</h1>
            <p className="text-lg text-muted-foreground">
              Discover and add apps to your Home and workspaces
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-lg h-12"
            />
          </div>

          {/* Tabs by Category */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Apps</TabsTrigger>
              {categories.map(cat => (
                <TabsTrigger key={cat} value={cat} className="capitalize">
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredApps.map((app) => {
                  const Icon = app.icon;
                  const isInstalled = installedApps.has(app.id);
                  
                  return (
                    <Card key={app.id} className="hover:border-primary transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle>{app.name}</CardTitle>
                              <Badge variant="secondary" className="mt-1 capitalize">
                                {app.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <CardDescription className="mt-2">
                          {app.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex gap-2">
                        {isInstalled ? (
                          <>
                            <Button
                              variant="default"
                              onClick={() => handleLaunch(app.route)}
                              className="flex-1"
                            >
                              Launch
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleUninstall(app.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Installed
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="default"
                            onClick={() => handleInstall(app.id)}
                            className="flex-1"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Install
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {categories.map(category => (
              <TabsContent key={category} value={category} className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredApps
                    .filter(app => app.category === category)
                    .map((app) => {
                      const Icon = app.icon;
                      const isInstalled = installedApps.has(app.id);
                      
                      return (
                        <Card key={app.id} className="hover:border-primary transition-colors">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <Icon className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>{app.name}</CardTitle>
                              </div>
                            </div>
                            <CardDescription className="mt-2">
                              {app.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex gap-2">
                            {isInstalled ? (
                              <>
                                <Button
                                  variant="default"
                                  onClick={() => handleLaunch(app.route)}
                                  className="flex-1"
                                >
                                  Launch
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleUninstall(app.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Installed
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="default"
                                onClick={() => handleInstall(app.id)}
                                className="flex-1"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Install
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </>
  );
}
