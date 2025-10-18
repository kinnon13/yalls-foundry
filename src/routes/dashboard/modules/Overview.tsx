/**
 * Overview Module
 * Rocker Next Best Actions, KPIs, Quick Create
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KpiTiles } from '@/components/dashboard/KpiTiles';
import { NbaList } from '@/components/dashboard/NbaList';
import { AlertCircle, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function Overview() {
  const { session } = useSession();

  // Get first entity ID for KPI display
  const { data: firstEntityId } = useQuery({
    queryKey: ['first-entity', session?.userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('entities')
        .select('id')
        .eq('owner_user_id', session?.userId)
        .limit(1)
        .single();
      return data?.id;
    },
    enabled: !!session?.userId,
  });

  // Fetch pending approvals count
  const { data: pendingApprovals } = useQuery({
    queryKey: ['pending-approvals', session?.userId],
    queryFn: async () => {
      // Get entities owned by user
      const { data: entities } = await supabase
        .from('entities')
        .select('id')
        .eq('owner_user_id', session?.userId);
      
      if (!entities?.length) return 0;
      
      const entityIds = entities.map(e => e.id);
      
      // Count unapproved post_targets for owned entities
      const { count } = await supabase
        .from('post_targets')
        .select('*', { count: 'exact', head: true })
        .in('target_entity_id', entityIds)
        .eq('approved', false);
      
      return count || 0;
    },
    enabled: !!session?.userId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Owner HQ</h1>
        <p className="text-muted-foreground">Your command center</p>
      </div>

      {/* KPIs */}
      {firstEntityId && <KpiTiles entityId={firstEntityId} />}

      {/* Pending Approvals Alert */}
      {pendingApprovals && pendingApprovals > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <CardTitle>Pending Approvals</CardTitle>
              </div>
              <Badge variant="outline">{pendingApprovals}</Badge>
            </div>
            <CardDescription>
              You have cross-post requests waiting for review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard?module=events">View Moderation Queue</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Rocker Next Best Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Suggested Actions</CardTitle>
          <CardDescription>AI-powered recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <NbaList />
        </CardContent>
      </Card>

      {/* Quick Create */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Create</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Post
            </Button>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Listing
            </Button>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Event
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
