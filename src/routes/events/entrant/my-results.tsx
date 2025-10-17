/**
 * My Results - Show user their competition results
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Award } from 'lucide-react';

export default function MyResults() {
  const { data: myResults = [] } = useQuery({
    queryKey: ['my-results'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get my entries first
      const { data: entries } = await supabase
        .from('entries')
        .select('id')
        .eq('rider_user_id', user.id);

      if (!entries || entries.length === 0) return [];

      // Get results for my entries
      const { data: results } = await supabase
        .from('results')
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

      return results || [];
    },
  });

  const firstPlaces = myResults.filter((r: any) => r.place === 1).length;
  const totalPlacements = myResults.filter((r: any) => r.place && r.place <= 10).length;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Results</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <div className="text-sm text-muted-foreground">1st Places</div>
            </div>
            <div className="text-2xl font-bold">{firstPlaces}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-blue-500" />
              <div className="text-sm text-muted-foreground">Top 10</div>
            </div>
            <div className="text-2xl font-bold">{totalPlacements}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-green-500" />
              <div className="text-sm text-muted-foreground">Total Runs</div>
            </div>
            <div className="text-2xl font-bold">{myResults.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Results List */}
      <Card>
        <CardHeader>
          <CardTitle>Competition Results</CardTitle>
        </CardHeader>
        <CardContent>
          {myResults.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No results yet</p>
              <p className="text-sm mt-2">Results will appear here once published</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myResults.map((result: any) => (
                <div key={result.id} className="p-4 border rounded">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-bold">
                        {result.entry?.event_class?.event?.title || 'Event'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {result.entry?.event_class?.title || 'Class'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.place && result.place <= 3 && (
                        <Trophy
                          className={`h-6 w-6 ${
                            result.place === 1 ? 'text-yellow-500' :
                            result.place === 2 ? 'text-gray-400' :
                            'text-amber-600'
                          }`}
                        />
                      )}
                      <Badge variant={result.place && result.place <= 3 ? 'default' : 'secondary'}>
                        {result.place ? `${result.place}${
                          result.place === 1 ? 'st' :
                          result.place === 2 ? 'nd' :
                          result.place === 3 ? 'rd' : 'th'
                        } Place` : 'Participated'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {result.time_sec && (
                      <div>
                        <div className="text-muted-foreground">Time</div>
                        <div className="font-mono font-bold">
                          {result.time_sec.toFixed(3)}s
                        </div>
                      </div>
                    )}

                    {result.score !== null && result.score !== undefined && (
                      <div>
                        <div className="text-muted-foreground">Score</div>
                        <div className="font-bold">{result.score}</div>
                      </div>
                    )}

                    {result.penalties !== null && result.penalties !== undefined && (
                      <div>
                        <div className="text-muted-foreground">Penalties</div>
                        <div className={result.penalties > 0 ? 'text-red-500 font-bold' : ''}>
                          +{result.penalties}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="text-muted-foreground">Horse</div>
                      <div>{result.entry?.horse_entity_id || 'TBD'}</div>
                    </div>
                  </div>

                  {result.payout_cents && result.payout_cents > 0 && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-green-600" />
                      <span className="font-medium">
                        Prize: ${(result.payout_cents / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
