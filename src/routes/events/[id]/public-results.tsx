/**
 * Public Results Page (SEO-safe, no auth, live updates)
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/design/components/Card';
import { Badge } from '@/design/components/Badge';
import { Button } from '@/design/components/Button';
import { getEventClasses, getClassResults } from '@/lib/rodeo/service';
import { tokens } from '@/design/tokens';

export default function PublicResults() {
  const { id: eventId } = useParams();

  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['event-classes', eventId],
    queryFn: () => getEventClasses(eventId!),
    enabled: !!eventId,
  });

  const { data: results = [], isLoading: loadingResults } = useQuery({
    queryKey: ['event-results-public', eventId, classes.map(c => c.id)],
    queryFn: async () => {
      const results = await Promise.all(
        classes.map(async (c: any) => ({
          classId: c.id,
          classTitle: c.title,
          results: await getClassResults(c.id),
        }))
      );
      return results.filter(r => r.results.length > 0);
    },
    enabled: !!eventId && classes.length > 0,
    refetchInterval: 5000, // Live updates every 5s
  });

  if (loadingClasses || loadingResults) return <div style={{ padding: tokens.space.m }}>Loading results...</div>;

  if (results.length === 0) {
    return (
      <div style={{ padding: tokens.space.m }}>
        <Card>
          <div style={{ textAlign: 'center', opacity: 0.7 }}>No results yet.</div>
        </Card>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div style={{ padding: tokens.space.m }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.space.m }}>
        <h2 style={{ fontSize: tokens.typography.size.xl, fontWeight: tokens.typography.weight.bold }}>Results</h2>
        <Button variant="secondary" onClick={handleShare}>Share</Button>
      </div>

      {results.map((group: any) => (
        <div key={group.classId} style={{ marginBottom: tokens.space.m }}>
          <Card padding="m">
          <h3 style={{ fontSize: tokens.typography.size.l, fontWeight: tokens.typography.weight.semibold, marginBottom: tokens.space.s }}>
            {group.classTitle}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.s }}>
            {group.results.map((result: any, idx: number) => (
              <div key={result.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: tokens.space.m,
                padding: tokens.space.s,
                borderBottom: idx < group.results.length - 1 ? `1px solid ${tokens.color.text.secondary}20` : 'none',
              }}>
                <Badge variant={result.place <= 3 ? 'success' : 'default'}>
                  {result.place || 'N/A'}
                </Badge>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: tokens.typography.weight.medium }}>{result.entry?.rider?.display_name || 'Unknown'}</div>
                  {result.entry?.horse && <div style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary }}>{result.entry.horse.display_name}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: tokens.typography.weight.semibold }}>
                    {result.dnf ? 'DNF' : (result.time_ms / 1000).toFixed(2) + 's'}
                  </div>
                  {result.penalties_ms > 0 && (
                    <div style={{ fontSize: tokens.typography.size.s, color: tokens.color.danger }}>
                      +{(result.penalties_ms / 1000).toFixed(2)}s
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          </Card>
        </div>
      ))}
    </div>
  );
}
