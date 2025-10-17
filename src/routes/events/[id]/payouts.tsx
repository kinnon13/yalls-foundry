/**
 * Event Payouts Tab (Producer)
 */

import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getEventClasses, getClassPayouts, computePayouts } from '@/lib/rodeo/service';
import { Price } from '@/design/components/Price';

export default function EventPayouts() {
  const { id: eventId } = useParams();
  const queryClient = useQueryClient();

  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['event-classes', eventId],
    queryFn: () => getEventClasses(eventId!),
    enabled: !!eventId
  });

  const { data: payouts = [], isLoading: loadingPayouts } = useQuery({
    queryKey: ['event-payouts', eventId, classes.map(c => c.id)],
    queryFn: async () => {
      const data = await Promise.all(
        classes.map(async (c) => ({
          classId: c.id,
          classTitle: c.title,
          payouts: await getClassPayouts(c.id)
        }))
      );
      return data;
    },
    enabled: !!eventId && classes.length > 0
  });

  const computeMutation = useMutation({
    mutationFn: (classId: string) => computePayouts(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-payouts', eventId] });
      toast.success('Payouts computed');
    },
    onError: (err: any) => toast.error(err.message)
  });

  if (loadingClasses || loadingPayouts) return <div className="p-4">Loading payouts...</div>;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Payouts (Mock)</h2>

      {payouts.map((group) => (
        <Card key={group.classId}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{group.classTitle}</span>
              {group.payouts.length === 0 && (
                <Button
                  size="sm"
                  onClick={() => computeMutation.mutate(group.classId)}
                  disabled={computeMutation.isPending}
                >
                  Compute
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {group.payouts.length === 0 ? (
              <div className="text-sm opacity-70">No payouts computed yet</div>
            ) : (
              <div className="space-y-1">
                {group.payouts.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-12 text-center font-medium">#{p.place}</div>
                      <div>{p.entry?.rider?.display_name || 'Unknown'}</div>
                    </div>
                    <Price cents={p.amount_cents} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
