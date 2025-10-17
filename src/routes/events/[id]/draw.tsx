/**
 * Event Draw Tab (Producer + Public)
 */

import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getEventClasses, getClassDraw, generateDraw } from '@/lib/rodeo/service';

export default function EventDraw() {
  const { id: eventId } = useParams();
  const queryClient = useQueryClient();

  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['event-classes', eventId],
    queryFn: () => getEventClasses(eventId!),
    enabled: !!eventId
  });

  const { data: draws = [], isLoading: loadingDraws } = useQuery({
    queryKey: ['event-draws', eventId, classes.map(c => c.id)],
    queryFn: async () => {
      const results = await Promise.all(
        classes.map(async (c) => ({
          classId: c.id,
          classTitle: c.title,
          draw: await getClassDraw(c.id, 1)
        }))
      );
      return results;
    },
    enabled: !!eventId && classes.length > 0
  });

  const generateMutation = useMutation({
    mutationFn: () => generateDraw(eventId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-draws', eventId] });
      toast.success('Draw generated');
    },
    onError: (err: any) => toast.error(err.message)
  });

  if (loadingClasses || loadingDraws) return <div className="p-4">Loading draw...</div>;

  const hasDraws = draws.some(g => g.draw.length > 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Draw</h2>
        {!hasDraws && (
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? 'Generating...' : 'Generate Draw'}
          </Button>
        )}
      </div>

      {!hasDraws && (
        <Card>
          <CardContent className="p-6 text-center opacity-70">
            No draw yet. Generate a draw to assign run positions.
          </CardContent>
        </Card>
      )}

      {draws.map((group) => (
        group.draw.length > 0 && (
          <Card key={group.classId}>
            <CardHeader>
              <CardTitle>{group.classTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {group.draw.map((d: any) => (
                  <div key={d.id} className="flex items-center gap-3 p-2 border rounded">
                    <div className="w-12 text-center font-medium">#{d.position}</div>
                    <div className="flex-1">
                      <div className="font-medium">{d.entry?.rider?.display_name || 'Unknown'}</div>
                      {d.entry?.horse && (
                        <div className="text-sm opacity-70">{d.entry.horse.display_name}</div>
                      )}
                    </div>
                    {d.back_number && (
                      <div className="text-sm opacity-70">Back #{d.back_number}</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      ))}
    </div>
  );
}
