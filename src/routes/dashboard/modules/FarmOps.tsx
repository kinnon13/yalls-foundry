/**
 * Farm Ops Module
 * Barn capacity, care due, calendar
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Calendar, Clipboard, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function FarmOps() {
  const { session } = useSession();

  // Fetch boarders count (capacity indicator)
  const { data: boardersCount } = useQuery({
    queryKey: ['boarders-count', session?.userId],
    queryFn: async () => {
      // Get user's farms
      const { data: farms } = await supabase
        .from('entities')
        .select('id')
        .eq('owner_user_id', session?.userId);
      
      if (!farms?.length) return 0;
      
      // Count boarders across farms (assuming business_id maps to farm entities)
      const { count } = await supabase
        .from('boarders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      return count || 0;
    },
    enabled: !!session?.userId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Farm Ops</h1>
        <p className="text-muted-foreground">Barn management & care</p>
      </div>

      {/* Capacity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Barn Capacity</CardTitle>
              <CardDescription>Active boarders</CardDescription>
            </div>
            <Building className="w-8 h-8 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{boardersCount || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">Horses boarded</p>
        </CardContent>
      </Card>

      {/* Care Due */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <CardTitle>Care Due (Next 7 Days)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No overdue care tasks
          </p>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Private Calendar</CardTitle>
          <CardDescription>Your farm schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" asChild>
            <a href="/farm/calendar">
              <Calendar className="w-4 h-4 mr-2" />
              Open Calendar
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline">
              <Clipboard className="w-4 h-4 mr-2" />
              Add Task
            </Button>
            <Button size="sm" variant="outline">
              <Building className="w-4 h-4 mr-2" />
              Log Care Event
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
