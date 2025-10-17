/**
 * Incentives Feature
 * Context-aware kernel for discovering, nominating, and managing incentive programs
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Award, Calendar, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { nominateHorse, hasIncentiveAction } from '@/feature-kernel/contextUtils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';

interface IncentivesFeatureProps {
  horse?: string;
  program?: string;
  mode?: 'discover' | 'nominate' | 'enter' | 'pay' | 'draws';
}

export default function IncentivesFeature(props: IncentivesFeatureProps) {
  const { toast } = useToast();
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(props.mode || 'discover');

  // Fetch incentives
  const { data: incentives = [], isLoading } = useQuery({
    queryKey: ['incentives', props.program],
    queryFn: async () => {
      let query = supabase
        .from('incentives')
        .select('*')
        .eq('status', 'active')
        .order('deadline_at', { ascending: true });

      if (props.program) {
        query = query.eq('id', props.program);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Check if user can nominate
  const { data: canNominate = false } = useQuery({
    queryKey: ['can-nominate', props.horse, props.program],
    queryFn: async () => {
      if (!props.horse || !props.program || !session?.userId) return false;
      return hasIncentiveAction({
        userId: session.userId,
        horseId: props.horse,
        incentiveId: props.program,
      });
    },
    enabled: !!props.horse && !!props.program && !!session?.userId,
  });

  // Nomination mutation
  const nominateMutation = useMutation({
    mutationFn: async (incentiveId: string) => {
      if (!props.horse) throw new Error('No horse selected');
      return nominateHorse({
        horseId: props.horse,
        incentiveId,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Horse nominated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['nominations'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Incentives
          </CardTitle>
          <CardDescription>
            {props.horse 
              ? 'Nominate your horse for incentive programs'
              : 'Discover available incentive programs'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="discover">Discover</TabsTrigger>
              <TabsTrigger value="nominate" disabled={!props.horse}>
                Nominate
              </TabsTrigger>
              <TabsTrigger value="enter" disabled={!props.horse}>
                Enter
              </TabsTrigger>
              <TabsTrigger value="draws">Draws</TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-4">
              {incentives.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active incentive programs found
                </div>
              ) : (
                <div className="grid gap-4">
                  {incentives.map((incentive) => (
                    <Card key={incentive.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{incentive.program_name}</span>
                          <Award className="h-5 w-5 text-primary" />
                        </CardTitle>
                        <CardDescription>
                          Deadline: {new Date(incentive.deadline_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            Entry Fee: ${(incentive.entry_fee_cents / 100).toFixed(2)}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // View details or nominate
                              toast({
                                title: 'View Program',
                                description: 'Program details would open here',
                              });
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="nominate" className="space-y-4">
              {!props.horse ? (
                <div className="text-center py-8 text-muted-foreground">
                  Select a horse to nominate
                </div>
              ) : !canNominate ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      This horse is not eligible or you don't have permission to nominate
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {incentives.map((incentive) => (
                    <Card key={incentive.id}>
                      <CardHeader>
                        <CardTitle>{incentive.program_name}</CardTitle>
                        <CardDescription>
                          Deadline: {new Date(incentive.deadline_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => nominateMutation.mutate(incentive.id)}
                          disabled={nominateMutation.isPending}
                        >
                          {nominateMutation.isPending ? 'Nominating...' : 'Nominate Horse'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="enter" className="space-y-4">
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Entry management coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="draws" className="space-y-4">
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Draws and results coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
