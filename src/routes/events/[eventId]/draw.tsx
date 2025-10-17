/**
 * Public Draw Page - Shows draw order for event classes
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function DrawPage() {
  const { eventId } = useParams();

  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, profiles(display_name, avatar_url)')
        .eq('id', eventId)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const { data: classes, isLoading } = useQuery({
    queryKey: ['event-classes', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_classes')
        .select(`
          *,
          entries(
            id,
            draw_position,
            status,
            profiles!entries_rider_user_id_fkey(display_name),
            entities!entries_horse_entity_id_fkey(display_name)
          )
        `)
        .eq('event_id', eventId)
        .order('sequence', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{event?.title} - Draw</h1>
          {event?.starts_at && (
            <p className="text-muted-foreground">
              {new Date(event.starts_at).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="space-y-6">
          {classes?.map((cls: any) => (
            <Card key={cls.id}>
              <CardHeader>
                <CardTitle>{cls.title}</CardTitle>
                {cls.description && (
                  <p className="text-sm text-muted-foreground">{cls.description}</p>
                )}
              </CardHeader>
              <CardContent>
                {cls.entries?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No entries yet</p>
                ) : (
                  <div className="space-y-2">
                    {cls.entries
                      ?.sort((a: any, b: any) => (a.draw_position || 999) - (b.draw_position || 999))
                      .map((entry: any) => (
                        <div key={entry.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-full font-bold">
                            {entry.draw_position || '-'}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">
                              {entry.profiles?.display_name || 'Unknown Rider'}
                            </p>
                            {entry.entities?.display_name && (
                              <p className="text-sm text-muted-foreground">
                                {entry.entities.display_name}
                              </p>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            entry.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            entry.status === 'scratched' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {entry.status}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
