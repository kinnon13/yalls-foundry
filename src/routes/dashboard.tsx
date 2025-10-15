/**
 * Comprehensive User Dashboard
 * 
 * Central hub showing all account capabilities, connections, and analytics
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, Users, DollarSign, Award, Building2, User, 
  BarChart3, Target, ShoppingCart, Calendar as CalendarIcon, Shield, Activity 
} from 'lucide-react';
import { useSession } from '@/lib/auth/context';
import { supabase } from '@/integrations/supabase/client';
import { getMyMLMStats, getMyCommissions } from '@/lib/mlm/service.supabase';
import { formatCents, getRankBadgeClass } from '@/entities/mlm';
import { Link } from 'react-router-dom';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import RLSScanner from '@/routes/admin/panels/RLSScanner';
import TestRunner from '@/routes/admin/panels/TestRunner';
import CodeSearchPanel from '@/routes/admin/panels/CodeSearchPanel';
import AuthPanel from '@/routes/admin/panels/AuthPanel';
import FeedbackInbox from '@/routes/admin/panels/FeedbackInbox';
import { SuggestionsPanel } from '@/routes/admin/panels/SuggestionsPanel';
import { FlagsPanel } from '@/routes/admin/panels/FlagsPanel';
import { ScaleScorecard } from '@/lib/observability/ScaleScorecard';
import { BusinessMetrics } from '@/components/business/BusinessMetrics';

export default function Dashboard() {
  const { session } = useSession();
  const { isAdmin, isLoading: adminCheckLoading } = useAdminCheck();

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile', session?.userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session?.userId)
        .maybeSingle();
      return data;
    },
    enabled: !!session?.userId,
  });

  // Fetch user's businesses
  const { data: businesses } = useQuery({
    queryKey: ['my-businesses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', session?.userId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!session?.userId,
  });

  // Fetch user's entity profiles (horses, farms, etc.)
  const { data: entities } = useQuery({
    queryKey: ['my-entities'],
    queryFn: async () => {
      const { data } = await supabase
        .from('entity_profiles')
        .select('*')
        .eq('owner_id', session?.userId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!session?.userId,
  });

  // Fetch MLM stats
  const { data: mlmStats } = useQuery({
    queryKey: ['mlm-stats'],
    queryFn: getMyMLMStats,
    enabled: !!session?.userId,
  });

  // Fetch recent commissions
  const { data: commissions } = useQuery({
    queryKey: ['recent-commissions'],
    queryFn: () => getMyCommissions({ limit: 5 }),
    enabled: !!session?.userId,
  });

  // Calculate totals
  const unpaidTotal = commissions?.filter(c => !c.paid_out).reduce((sum, c) => sum + c.amount_cents, 0) || 0;
  const totalBusinesses = businesses?.length || 0;
  const totalEntities = entities?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.display_name || 'User'}
            </p>
          </div>
          {mlmStats && (
            <Badge className={getRankBadgeClass(mlmStats.current_rank)} variant="outline">
              <Award className="w-4 h-4 mr-1" />
              {mlmStats.current_rank.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Businesses</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBusinesses}</div>
              <p className="text-xs text-muted-foreground">
                Active business accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profiles</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEntities}</div>
              <p className="text-xs text-muted-foreground">
                Horses, farms & more
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mlmStats?.total_downline_count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total team members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCents(unpaidTotal)}</div>
              <p className="text-xs text-muted-foreground">
                Pending commissions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="businesses">Businesses</TabsTrigger>
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            {isAdmin && !adminCheckLoading && (
              <TabsTrigger value="control-room">
                <Shield className="w-4 h-4 mr-2" />
                Control Room
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Recent Businesses */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Businesses</CardTitle>
                  <CardDescription>Manage your business accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  {businesses && businesses.length > 0 ? (
                    <div className="space-y-2">
                      {businesses.slice(0, 3).map((biz) => (
                        <Link
                          key={biz.id}
                          to={`/business/${biz.id}/hub`}
                          className="flex items-center justify-between p-3 border rounded hover:bg-accent transition-colors"
                        >
                          <div>
                            <p className="font-medium">{biz.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {biz.description?.slice(0, 50)}...
                            </p>
                          </div>
                          <BarChart3 className="w-4 h-4 text-muted-foreground" />
                        </Link>
                      ))}
                      {businesses.length === 0 && (
                        <p className="text-sm text-muted-foreground">No businesses yet</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Start building your business empire
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Commissions</CardTitle>
                  <CardDescription>Your latest earnings</CardDescription>
                </CardHeader>
                <CardContent>
                  {commissions && commissions.length > 0 ? (
                    <div className="space-y-2">
                      {commissions.map((commission) => (
                        <div
                          key={commission.id}
                          className="flex items-center justify-between p-3 border rounded"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {commission.commission_type.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(commission.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">
                              {formatCents(commission.amount_cents)}
                            </p>
                            <Badge variant={commission.paid_out ? 'default' : 'secondary'}>
                              {commission.paid_out ? 'Paid' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No commissions yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-4">
                  <Button variant="outline" asChild>
                    <Link to="/calendar">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      My Calendar
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/horses/create">
                      <Target className="w-4 h-4 mr-2" />
                      Add Horse Profile
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/marketplace">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Browse Marketplace
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/events">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Find Events
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Businesses Tab */}
          <TabsContent value="businesses" className="space-y-4">
            {businesses && businesses.length > 0 ? (
              <>
                {businesses.map((biz) => (
                  <Card key={biz.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{biz.name}</CardTitle>
                          <CardDescription>{biz.description}</CardDescription>
                        </div>
                        <Link to={`/business/${biz.id}/hub`}>
                          <Button variant="outline" size="sm">
                            <Building2 className="w-4 h-4 mr-2" />
                            Full Hub
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <BusinessMetrics businessId={biz.id} />
                      
                      {/* Capabilities */}
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-2">Capabilities</h4>
                        <div className="flex gap-2 flex-wrap">
                          {(biz.capabilities as string[])?.map((cap: string) => (
                            <Badge key={cap} variant="secondary">
                              {cap}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/business/${biz.id}/crm/contacts`}>CRM</Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/business/${biz.id}/settings/profile`}>Settings</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No businesses yet. Create your first one!
                    </p>
                    <Button>Create Business</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Profiles Tab */}
          <TabsContent value="profiles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Profiles</CardTitle>
                <CardDescription>Horses, farms, and other entities</CardDescription>
              </CardHeader>
              <CardContent>
                {entities && entities.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {entities.map((entity) => (
                      <Link
                        key={entity.id}
                        to={`/${entity.entity_type}s/${entity.id}`}
                        className="p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <Badge variant="outline" className="mb-2">
                          {entity.entity_type}
                        </Badge>
                        <h3 className="font-bold">{entity.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {entity.description?.slice(0, 60)}...
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No profiles yet. Create your first one!
                    </p>
                    <Button asChild>
                      <Link to="/horses/create">Create Profile</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-4">
            {mlmStats ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Size</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {mlmStats.total_downline_count}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {mlmStats.direct_referrals_count} direct referrals
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {formatCents(mlmStats.personal_volume_cents)}
                      </div>
                      <p className="text-sm text-muted-foreground">This period</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {formatCents(mlmStats.team_volume_cents)}
                      </div>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Full MLM Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button asChild>
                      <Link to="/mlm/dashboard">View Detailed Network Analytics</Link>
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Network features not yet activated for your account
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Overview</CardTitle>
                <CardDescription>
                  Coming soon: Comprehensive analytics across all your accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Advanced analytics and reporting features are being built</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Control Room Tab - Admin Only */}
          {isAdmin && (
            <TabsContent value="control-room" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Admin Control Room
                  </CardTitle>
                  <CardDescription>
                    Platform diagnostics, security scanning, and system monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Platform Health */}
                  <div>
                    <h3 className="font-semibold mb-4">Platform Health</h3>
                    <ScaleScorecard />
                  </div>

                  {/* Quick Admin Actions */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Security Scan</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RLSScanner />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Test Runner</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <TestRunner />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Code Search</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CodeSearchPanel />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Auth Management</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <AuthPanel />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">User Feedback</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FeedbackInbox />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">AI Suggestions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <SuggestionsPanel />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Content Flags</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FlagsPanel />
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
