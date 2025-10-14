/**
 * Business Hub Dashboard
 * 
 * Overview with Recharts metrics (sales, activities, contacts)
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { businessService } from '@/lib/business/service.supabase';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSession } from '@/lib/auth/context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function BusinessHub() {
  const { bizId } = useParams<{ bizId: string }>();
  const { session } = useSession();

  // Fetch business
  const { data: business, isLoading } = useQuery({
    queryKey: ['business', bizId],
    queryFn: () => businessService.getById(bizId!),
    enabled: !!bizId,
  });

  // Fetch CRM metrics (stub: count activities by type)
  const { data: metrics } = useQuery({
    queryKey: ['business-metrics', bizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_activities')
        .select('activity_type, value')
        .eq('business_id', bizId!);

      if (error) throw error;

      // Aggregate by activity type
      const aggregated = (data || []).reduce((acc, item) => {
        const existing = acc.find((a: any) => a.type === item.activity_type);
        if (existing) {
          existing.count++;
          existing.value += item.value || 0;
        } else {
          acc.push({ type: item.activity_type, count: 1, value: item.value || 0 });
        }
        return acc;
      }, [] as any[]);

      return aggregated;
    },
    enabled: !!bizId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!business) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Business not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{business.name}</h1>
        <p className="text-muted-foreground">{business.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {metrics?.reduce((sum, m) => sum + m.count, 0) || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ${metrics?.reduce((sum, m) => sum + m.value, 0).toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{business.capabilities?.join(', ') || 'None'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics && metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground">No activity data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
