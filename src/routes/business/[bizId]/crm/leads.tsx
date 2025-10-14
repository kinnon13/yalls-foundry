/**
 * Business CRM - Leads Funnel
 * 
 * Funnel chart stub showing lead conversion stages
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const FUNNEL_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export default function BusinessCRMLeads() {
  const { bizId } = useParams<{ bizId: string }>();

  // Fetch lead funnel data (stub: count contacts by status)
  const { data: funnelData, isLoading } = useQuery({
    queryKey: ['crm-leads-funnel', bizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('status')
        .eq('business_id', bizId!);

      if (error) throw error;

      // Count by status
      const statusCounts: Record<string, number> = {};
      (data || []).forEach((contact) => {
        statusCounts[contact.status] = (statusCounts[contact.status] || 0) + 1;
      });

      // Funnel stages (lead → customer → vip)
      return [
        { stage: 'Lead', count: statusCounts['lead'] || 0 },
        { stage: 'Customer', count: statusCounts['customer'] || 0 },
        { stage: 'VIP', count: statusCounts['vip'] || 0 },
        { stage: 'Inactive', count: statusCounts['inactive'] || 0 },
      ];
    },
    enabled: !!bizId,
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const totalLeads = funnelData?.reduce((sum, stage) => sum + stage.count, 0) || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Leads Funnel</h1>

      <div className="grid gap-4 md:grid-cols-4">
        {funnelData?.map((stage, index) => (
          <Card key={stage.stage}>
            <CardHeader>
              <CardTitle className="text-sm">{stage.stage}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stage.count}</p>
              <p className="text-xs text-muted-foreground">
                {totalLeads > 0 ? ((stage.count / totalLeads) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          {funnelData && funnelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count">
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground">No funnel data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
