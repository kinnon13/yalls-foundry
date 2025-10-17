/**
 * My Draws - Show user their draw positions
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Hash, Calendar } from 'lucide-react';

export default function MyDraws() {
  const { data: myDraws = [] } = useQuery({
    queryKey: ['my-draws'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get my entries first
      const { data: entries } = await supabase
        .from('entries')
        .select('id')
        .eq('rider_user_id', user.id);

      if (!entries || entries.length === 0) return [];

      // Get draws for my entries
      const { data: draws } = await supabase
        .from('draws')
        .select(`
          *,
          entry:entries (
            *,
            event_class:event_classes (
              *,
              event:events (*)
            )
          )
        `)
        .in('entry_id', entries.map(e => e.id))
        .order('created_at', { ascending: false });

      return draws || [];
    },
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Draw Positions</h1>

      {myDraws.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              <p>No draw positions yet</p>
              <p className="text-sm mt-2">Draws will appear here once published by the event producer</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {myDraws.map((draw: any) => (
            <Card key={draw.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {draw.entry?.event_class?.event?.title || 'Event'}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground mt-1">
                      {draw.entry?.event_class?.title || 'Class'}
                    </div>
                  </div>
                  <Badge variant="default">
                    Performance {draw.perf_num || 1}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-accent rounded">
                    <Hash className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">#{draw.position}</div>
                    <div className="text-xs text-muted-foreground">Draw Position</div>
                  </div>

                  {draw.back_number && (
                    <div className="text-center p-4 bg-accent rounded">
                      <Hash className="h-6 w-6 mx-auto mb-2" />
                      <div className="text-2xl font-bold">#{draw.back_number}</div>
                      <div className="text-xs text-muted-foreground">Back Number</div>
                    </div>
                  )}

                  <div className="text-center p-4 bg-accent rounded">
                    <Calendar className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">
                      {draw.entry?.event_class?.event?.starts_at
                        ? new Date(draw.entry.event_class.event.starts_at).toLocaleDateString()
                        : 'TBD'}
                    </div>
                    <div className="text-xs text-muted-foreground">Event Date</div>
                  </div>

                  <div className="text-center p-4 bg-accent rounded">
                    <div className="text-sm font-medium">
                      {draw.entry?.horse_entity_id || 'Horse TBD'}
                    </div>
                    <div className="text-xs text-muted-foreground">Horse</div>
                  </div>
                </div>

                {draw.notes && (
                  <div className="mt-4 p-3 bg-muted rounded text-sm">
                    <div className="font-medium mb-1">Notes:</div>
                    <div>{draw.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
