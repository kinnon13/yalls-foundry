/**
 * Business Metrics Component
 * Shows CRM activities and revenue for a business
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

interface BusinessMetricsProps {
  businessId: string;
}

export function BusinessMetrics({ businessId }: BusinessMetricsProps) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['business-metrics', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_activities')
        .select('activity_type, value')
        .eq('business_id', businessId);

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
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No activity data yet
      </div>
    );
  }

  const totalActivities = metrics.reduce((sum, m) => sum + m.count, 0);
  const totalRevenue = metrics.reduce((sum, m) => sum + m.value, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-sm text-muted-foreground">Total Activities</div>
          <div className="text-2xl font-bold">{totalActivities}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Total Revenue</div>
          <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Activity Breakdown</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
