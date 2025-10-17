/**
 * Event Entries Tab (Producer)
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getEventClasses, getClassEntries } from '@/lib/rodeo/service';
import { Price } from '@/design/components/Price';

export default function EventEntries() {
  const { id: eventId } = useParams();

  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['event-classes', eventId],
    queryFn: () => getEventClasses(eventId!),
    enabled: !!eventId
  });

  const { data: allEntries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['event-entries', eventId, classes.map(c => c.id)],
    queryFn: async () => {
      const results = await Promise.all(
        classes.map(async (c) => ({
          classId: c.id,
          classTitle: c.title,
          entries: await getClassEntries(c.id)
        }))
      );
      return results;
    },
    enabled: !!eventId && classes.length > 0
  });

  if (loadingClasses || loadingEntries) return <div className="p-4">Loading entries...</div>;

  if (classes.length === 0) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center opacity-70">
            Add classes first to start accepting entries.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Entries</h2>

      {allEntries.map((group) => (
        <Card key={group.classId}>
          <CardHeader>
            <CardTitle>{group.classTitle} ({group.entries.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {group.entries.length === 0 ? (
              <div className="text-sm opacity-70">No entries yet</div>
            ) : (
              <div className="space-y-2">
                {group.entries.map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{entry.rider?.display_name || 'Unknown Rider'}</div>
                      {entry.horse && <div className="text-sm opacity-70">{entry.horse.display_name}</div>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Price cents={entry.fees_cents} size="sm" />
                      <Badge variant={entry.status === 'accepted' ? 'default' : 'secondary'}>
                        {entry.status}
                      </Badge>
                    </div>
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
