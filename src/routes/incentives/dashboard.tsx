/**
 * Incentives Dashboard - Complete with Nominations, Programs, Bonuses
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, DollarSign, Award, TrendingUp } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useState } from 'react';
import { toast } from 'sonner';
import { nominateFoal, checkBonusEligibility } from '@/lib/stallions/service';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function IncentivesDashboard() {
  const [foalId, setFoalId] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  const { data: programs = [] } = useQuery({
    queryKey: ['incentive-programs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('incentive_programs' as any)
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: myNominations = [], refetch: refetchNominations } = useQuery({
    queryKey: ['my-nominations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('nominations' as any)
        .select('*')
        .eq('nominated_by', user.id)
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
        .from('bonus_payouts' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      return data || [];
    },
  });

  const totalPending = bonusPayouts
    .filter((p: any) => p.status === 'pending')
    .reduce((sum: number, p: any) => sum + (p.amount_cents || 0), 0);

  const totalPaid = bonusPayouts
    .filter((p: any) => p.status === 'paid')
    .reduce((sum: number, p: any) => sum + (p.amount_cents || 0), 0);

  const handleNominateFoal = async () => {
    if (!foalId || !selectedProgram) {
      toast.error('Please enter foal ID and select program');
      return;
    }

    try {
      await nominateFoal(foalId, selectedProgram);
      toast.success('Foal nominated successfully');
      setFoalId('');
      setSelectedProgram(null);
      refetchNominations();
    } catch (error) {
      toast.error('Failed to nominate foal');
    }
  };

  const handleCheckEligibility = async (foalEntityId: string) => {
    try {
      const eligible = await checkBonusEligibility(foalEntityId);
      if (eligible && (eligible as any[]).length > 0) {
        toast.success(`Eligible for ${(eligible as any[]).length} bonuses`);
      } else {
        toast.info('No bonuses available yet');
      }
    } catch (error) {
      toast.error('Failed to check eligibility');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Incentive Programs</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <div className="text-sm text-muted-foreground">Nominations</div>
            </div>
            <div className="text-2xl font-bold">{myNominations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-2xl font-bold">
              ${(totalPending / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-blue-500" />
              <div className="text-sm text-muted-foreground">Paid Out</div>
            </div>
            <div className="text-2xl font-bold">
              ${(totalPaid / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div className="text-sm text-muted-foreground">Programs</div>
            </div>
            <div className="text-2xl font-bold">{programs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="programs">
        <TabsList className="mb-6">
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="nominations">My Nominations</TabsTrigger>
          <TabsTrigger value="payouts">Bonus History</TabsTrigger>
        </TabsList>

        <TabsContent value="programs">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Available Programs</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Trophy className="h-4 w-4 mr-2" />
                        Nominate Foal
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nominate a Foal</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Foal Entity ID</label>
                          <Input
                            value={foalId}
                            onChange={(e) => setFoalId(e.target.value)}
                            placeholder="Enter foal ID"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Select Program</label>
                          <div className="space-y-2">
                            {programs.map((p: any) => (
                              <div
                                key={p.id}
                                className={`p-3 border rounded cursor-pointer transition-colors ${
                                  selectedProgram === p.id ? 'bg-accent' : 'hover:bg-accent/50'
                                }`}
                                onClick={() => setSelectedProgram(p.id)}
                              >
                                <div className="font-medium">{p.name}</div>
                                <div className="text-sm text-muted-foreground">{p.description}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button onClick={handleNominateFoal} className="w-full">
                          Submit Nomination
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {programs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active programs available
                  </div>
                ) : (
                  <div className="space-y-3">
                    {programs.map((p: any) => (
                      <div key={p.id} className="p-4 border rounded">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-lg">{p.name}</h3>
                          <Badge variant="default">Active</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{p.description}</p>
                        {p.starts_at && p.ends_at && (
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div>Start: {new Date(p.starts_at).toLocaleDateString()}</div>
                            <div>End: {new Date(p.ends_at).toLocaleDateString()}</div>
                          </div>
                        )}
                        {p.prize_structure && (
                          <div className="mt-3 p-2 bg-muted rounded">
                            <div className="text-sm font-medium mb-1">Prize Structure:</div>
                            <div className="text-xs space-y-1">
                              {Object.entries(p.prize_structure).map(([key, value]: [string, any]) => (
                                <div key={key} className="flex justify-between">
                                  <span>{key}:</span>
                                  <span className="font-mono">${(value / 100).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nominations">
          <Card>
            <CardHeader>
              <CardTitle>My Nominations</CardTitle>
            </CardHeader>
            <CardContent>
              {myNominations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No nominations yet
                </div>
              ) : (
                <div className="space-y-2">
                  {myNominations.map((n: any) => (
                    <div key={n.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">Foal ID: {n.foal_entity_id}</div>
                        <div className="text-sm text-muted-foreground">
                          Program ID: {n.program_id}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Nominated: {new Date(n.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={n.status === 'active' ? 'default' : 'outline'}>
                          {n.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckEligibility(n.foal_entity_id)}
                        >
                          Check Eligibility
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Bonus Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              {bonusPayouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payouts yet
                </div>
              ) : (
                <div className="space-y-2">
                  {bonusPayouts.map((payout: any) => (
                    <div key={payout.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">
                          ${(payout.amount_cents / 100).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(payout.created_at).toLocaleDateString()}
                        </div>
                        {payout.event_result_id && (
                          <div className="text-xs text-muted-foreground">
                            Event Result: {payout.event_result_id}
                          </div>
                        )}
                      </div>
                      <Badge variant={
                        payout.status === 'paid' ? 'default' :
                        payout.status === 'pending' ? 'outline' : 'secondary'
                      }>
                        {payout.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
