/**
 * Event Results Tab (Producer + Public)
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEventClasses, getClassResults } from '@/lib/rodeo/service';

export default function EventResults() {
  const { id: eventId } = useParams();

  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['event-classes', eventId],
    queryFn: () => getEventClasses(eventId!),
    enabled: !!eventId
  });

  const { data: results = [], isLoading: loadingResults } = useQuery({
    queryKey: ['event-results', eventId, classes.map(c => c.id)],
    queryFn: async () => {
      const data = await Promise.all(
        classes.map(async (c) => ({
          classId: c.id,
          classTitle: c.title,
          results: await getClassResults(c.id)
        }))
      );
      return data;
    },
    enabled: !!eventId && classes.length > 0
  });

  if (loadingClasses || loadingResults) return <div className="p-4">Loading results...</div>;

  const hasResults = results.some(g => g.results.length > 0);

  if (!hasResults) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center opacity-70">
            No results yet. Record times/scores to see results here.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Results</h2>

      {results.map((group) => (
        group.results.length > 0 && (
          <Card key={group.classId}>
            <CardHeader>
              <CardTitle>{group.classTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {group.results.map((r: any, idx: number) => {
                  const totalTime = (r.time_ms || 0) + (r.penalties_ms || 0);
                  return (
                    <div key={r.id} className="flex items-center gap-3 p-2 border rounded">
                      <div className="w-12 text-center font-medium">#{idx + 1}</div>
                      <div className="flex-1">
                        <div className="font-medium">{r.entry?.rider?.display_name || 'Unknown'}</div>
                        {r.entry?.horse && (
                          <div className="text-sm opacity-70">{r.entry.horse.display_name}</div>
                        )}
                      </div>
                      <div className="text-right">
                        {r.dnf ? (
                          <span className="text-sm opacity-70">DNF</span>
                        ) : (
                          <div className="font-mono">
                            {(totalTime / 1000).toFixed(3)}s
                            {r.penalties_ms > 0 && (
                              <span className="text-sm opacity-70 ml-1">
                                (+{(r.penalties_ms / 1000).toFixed(1)}s)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )
      ))}
    </div>
  );
}
