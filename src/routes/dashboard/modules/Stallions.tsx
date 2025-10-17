/**
 * Stallions Module
 * Stallion pages using same profile infrastructure
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, FileText, Award } from 'lucide-react';

export function Stallions() {
  const { session } = useSession();

  const { data: stallions } = useQuery({
    queryKey: ['my-stallions', session?.userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('entities')
        .select('*')
        .eq('owner_user_id', session?.userId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!session?.userId,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stallions</h1>
          <p className="text-muted-foreground">Manage stallion pages</p>
        </div>
        <Button>
          <User className="w-4 h-4 mr-2" />
          Add Stallion
        </Button>
      </div>

      {stallions && stallions.length > 0 ? (
        <div className="space-y-4">
          {stallions.map((stallion) => (
            <Card key={stallion.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{stallion.display_name}</CardTitle>
                    <CardDescription>@{stallion.handle}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/profile/${stallion.id}`}>View Profile</a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Draft Contract
                  </Button>
                  <Button size="sm" variant="outline">
                    <Award className="w-4 h-4 mr-2" />
                    Nominate Foal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No stallions yet</p>
              <Button>Add Your First Stallion</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
