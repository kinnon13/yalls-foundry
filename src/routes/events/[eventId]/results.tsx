/**
 * Public Results Page - Shows final results for event classes
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trophy, Medal } from 'lucide-react';

export default function ResultsPage() {
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
    queryKey: ['event-results', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_classes')
        .select(`
          *,
          results(
            id,
            placement,
            score,
            time_seconds,
            notes,
            entries(
              id,
              profiles!entries_rider_user_id_fkey(display_name),
              entities!entries_horse_entity_id_fkey(display_name)
            )
          )
        `)
        .eq('event_id', eventId)
        .order('sequence', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const getPlacementIcon = (placement: number) => {
    if (placement === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (placement === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (placement === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return null;
  };

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
          <h1 className="text-3xl font-bold">{event?.title} - Results</h1>
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
                {cls.results?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Results not yet available
                  </p>
                ) : (
                  <div className="space-y-2">
                    {cls.results
                      ?.sort((a: any, b: any) => (a.placement || 999) - (b.placement || 999))
                      .map((result: any) => (
                        <div key={result.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-full font-bold">
                            {result.placement || '-'}
                          </div>
                          {getPlacementIcon(result.placement)}
                          <div className="flex-1">
                            <p className="font-semibold">
                              {result.entries?.profiles?.display_name || 'Unknown Rider'}
                            </p>
                            {result.entries?.entities?.display_name && (
                              <p className="text-sm text-muted-foreground">
                                {result.entries.entities.display_name}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {result.score !== null && (
                              <p className="font-semibold">Score: {result.score}</p>
                            )}
                            {result.time_seconds !== null && (
                              <p className="text-sm text-muted-foreground">
                                Time: {result.time_seconds}s
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                {cls.results?.some((r: any) => r.notes) && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold mb-2">Notes</h4>
                    {cls.results
                      .filter((r: any) => r.notes)
                      .map((result: any) => (
                        <p key={result.id} className="text-sm text-muted-foreground">
                          #{result.placement}: {result.notes}
                        </p>
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
