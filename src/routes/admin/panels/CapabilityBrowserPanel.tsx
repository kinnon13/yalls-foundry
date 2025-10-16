/**
 * Capability Browser Panel
 * 
 * Admin interface for managing the dynamic capability/feature system
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Package, MapPin, Users, TrendingUp, 
  MessageSquare, BarChart3, Plus, Eye
} from 'lucide-react';
import { toast } from 'sonner';

type Feature = {
  id: string;
  slug: string;
  kind: 'module' | 'modal' | 'panel' | 'action';
  title: string;
  description: string | null;
  status: 'ga' | 'beta' | 'experimental' | 'deprecated';
  owner: string;
  created_at: string;
};

type CapabilityGap = {
  id: string;
  account_id: string | null;
  text: string;
  inferred_feature: string | null;
  status: string;
  votes: number;
  created_at: string;
  context: any;
};

export function CapabilityBrowserPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch features
  const { data: features, isLoading: featuresLoading } = useQuery({
    queryKey: ['features', kindFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('features' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (kindFilter) query = query.eq('kind', kindFilter);
      if (statusFilter) query = query.eq('status', statusFilter);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Fetch capability gaps
  const { data: gaps } = useQuery({
    queryKey: ['capability-gaps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('capability_gaps' as any)
        .select('*')
        .order('votes', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Fetch usage stats
  const { data: usageStats } = useQuery({
    queryKey: ['usage-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usage_events' as any)
        .select('event_type, feature_id, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  const filteredFeatures = features?.filter(f => 
    searchQuery === '' || 
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case 'module': return <Package className="h-4 w-4" />;
      case 'modal': return <Eye className="h-4 w-4" />;
      case 'panel': return <BarChart3 className="h-4 w-4" />;
      case 'action': return <Plus className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ga': return 'bg-green-500';
      case 'beta': return 'bg-blue-500';
      case 'experimental': return 'bg-orange-500';
      case 'deprecated': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Capability Browser
        </CardTitle>
        <CardDescription>
          Manage dynamic features, view adoption, and triage user requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="catalog" className="space-y-6">
          <TabsList>
            <TabsTrigger value="catalog">Feature Catalog</TabsTrigger>
            <TabsTrigger value="gaps">
              Capability Gaps
              {gaps && gaps.length > 0 && (
                <Badge variant="destructive" className="ml-2">{gaps.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>

          {/* Feature Catalog */}
          <TabsContent value="catalog" className="space-y-4">
            {/* Search & Filters */}
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={kindFilter || ''}
                onChange={(e) => setKindFilter(e.target.value || null)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Kinds</option>
                <option value="module">Modules</option>
                <option value="modal">Modals</option>
                <option value="panel">Panels</option>
                <option value="action">Actions</option>
              </select>
              <select
                value={statusFilter || ''}
                onChange={(e) => setStatusFilter(e.target.value || null)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Status</option>
                <option value="ga">GA</option>
                <option value="beta">Beta</option>
                <option value="experimental">Experimental</option>
              </select>
            </div>

            {/* Feature Grid */}
            {featuresLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading features...</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredFeatures?.map((feature) => (
                  <Card key={feature.id} className="hover:border-primary transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getKindIcon(feature.kind)}
                          <CardTitle className="text-base">{feature.title}</CardTitle>
                        </div>
                        <Badge className={getStatusColor(feature.status)}>
                          {feature.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {feature.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <code className="bg-muted px-2 py-1 rounded">{feature.slug}</code>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Owner: {feature.owner}</span>
                        <Badge variant="outline">{feature.kind}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredFeatures?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No features found matching your filters</p>
              </div>
            )}
          </TabsContent>

          {/* Capability Gaps */}
          <TabsContent value="gaps" className="space-y-4">
            <div className="space-y-3">
              {gaps?.map((gap) => (
                <Card key={gap.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm">{gap.text}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {gap.inferred_feature && (
                            <Badge variant="outline" className="mr-2">
                              {gap.inferred_feature}
                            </Badge>
                          )}
                          {gap.context?.route && (
                            <span className="text-muted-foreground">
                              from {gap.context.route}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{gap.status}</Badge>
                        <Badge variant="secondary">{gap.votes} votes</Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {(!gaps || gaps.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No capability gaps reported yet</p>
              </div>
            )}
          </TabsContent>

          {/* Usage Stats */}
          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recent Activity (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usageStats && usageStats.length > 0 ? (
                  <div className="space-y-2">
                    {usageStats.slice(0, 20).map((event: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm border-b pb-2">
                        <span className="font-medium">{event.event_type}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No usage data yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}