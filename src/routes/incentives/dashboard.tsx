import { Card } from '@/design/components/Card';
import { Badge } from '@/design/components/Badge';
import { tokens } from '@/design/tokens';

/**
 * Incentives Dashboard - Programs + Nominations
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, DollarSign } from 'lucide-react';

export default function IncentivesDashboard() {
  const { data: programs = [] } = useQuery({
    queryKey: ['incentive-programs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('incentive_programs')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: myNominations = [] } = useQuery({
    queryKey: ['my-nominations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('nominations')
        .select('*')
        .eq('nominated_by', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      return data || [];
    },
  });

  const { data: bonusPayouts = [] } = useQuery({
    queryKey: ['my-bonus-payouts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('bonus_payouts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      return data || [];
    },
  });

  const totalPending = bonusPayouts
    .filter((p: any) => p.status === 'pending')
    .reduce((sum: number, p: any) => sum + (p.amount_cents || 0), 0);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Incentive Programs</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <div className="text-sm text-muted-foreground">Active Nominations</div>
            </div>
            <div className="text-2xl font-bold">{myNominations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div className="text-sm text-muted-foreground">Pending Bonuses</div>
            </div>
            <div className="text-2xl font-bold">
              ${(totalPending / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-blue-500" />
              <div className="text-sm text-muted-foreground">Available Programs</div>
            </div>
            <div className="text-2xl font-bold">{programs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Programs */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Available Programs</CardTitle>
        </CardHeader>
        <CardContent>
          {programs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active programs
            </div>
          ) : (
            <div className="space-y-3">
              {programs.map((p: any) => (
                <div key={p.id} className="p-4 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold">{p.name}</h3>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                  {p.starts_at && p.ends_at && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(p.starts_at).toLocaleDateString()} - {new Date(p.ends_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Nominations */}
      {myNominations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Nominations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myNominations.map((n: any) => (
                <div key={n.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Foal ID: {n.foal_entity_id}</div>
                    <div className="text-sm text-muted-foreground">
                      Program ID: {n.program_id}
                    </div>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
