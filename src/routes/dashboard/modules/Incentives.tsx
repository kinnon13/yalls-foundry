/**
 * Incentives Module
 * Producer business owned programs, nominations, bonuses
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Plus, DollarSign, Building2 } from 'lucide-react';

export function Incentives() {
  const { session } = useSession();

  // Fetch producer businesses (filter by kind='business' and metadata.business_type='producer')
  const { data: producers } = useQuery({
    queryKey: ['my-producers', session?.userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('entities')
        .select('*')
        .eq('owner_user_id', session?.userId)
        .eq('kind', 'business');
      
      // Filter to only producer businesses by checking metadata
      return data?.filter((entity) => 
        entity.metadata && 
        typeof entity.metadata === 'object' && 
        'business_type' in entity.metadata && 
        entity.metadata.business_type === 'producer'
      ) || [];
    },
    enabled: !!session?.userId,
  });

  // Mock programs for now
  const programs: any[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Incentives</h1>
          <p className="text-muted-foreground">Producer programs & nominations</p>
        </div>
        {producers && producers.length > 0 && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Program
          </Button>
        )}
      </div>

      {!producers || producers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">
                No producer businesses found
              </p>
              <p className="text-sm text-muted-foreground">
                Only producer businesses can create incentive programs
              </p>
            </div>
          </CardContent>
        </Card>
      ) : programs && programs.length > 0 ? (
        <div className="space-y-4">
          {programs.map((program: any) => (
            <Card key={program.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {program.name}
                      <Badge variant="outline">
                        <Building2 className="w-3 h-3 mr-1" />
                        {program.entities?.display_name || 'Producer'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{program.description}</CardDescription>
                  </div>
                  <Badge variant="secondary">
                    <DollarSign className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Manage</Button>
                  <Button size="sm" variant="outline">Nominations</Button>
                  <Button size="sm" variant="outline">Bonuses</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No programs yet</p>
              <Button>Create First Program</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
