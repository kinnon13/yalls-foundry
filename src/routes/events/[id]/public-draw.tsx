/**
 * Public Draw Page (SEO-safe, no auth)
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/design/components/Card';
import { Badge } from '@/design/components/Badge';
import { Button } from '@/design/components/Button';
import { getEventClasses, getClassDraw } from '@/lib/rodeo/service';
import { tokens } from '@/design/tokens';

export default function PublicDraw() {
  const { id: eventId } = useParams();

  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['event-classes', eventId],
    queryFn: () => getEventClasses(eventId!),
    enabled: !!eventId,
  });

  const { data: draws = [], isLoading: loadingDraws } = useQuery({
    queryKey: ['event-draws-public', eventId, classes.map(c => c.id)],
    queryFn: async () => {
      const results = await Promise.all(
        classes.map(async (c: any) => ({
          classId: c.id,
          classTitle: c.title,
          draws: await getClassDraw(c.id),
        }))
      );
      return results.filter(r => r.draws.length > 0);
    },
    enabled: !!eventId && classes.length > 0,
  });

  if (loadingClasses || loadingDraws) return <div style={{ padding: tokens.space.m }}>Loading draw...</div>;

  if (draws.length === 0) {
    return (
      <div style={{ padding: tokens.space.m }}>
        <Card>
          <div style={{ textAlign: 'center', opacity: 0.7 }}>No draw yet.</div>
        </Card>
      </div>
    );
  }

  const handleCopy = () => {
    const text = draws.map((g: any) => {
      return `${g.classTitle}\n${g.draws.map((d: any, i: number) => `${i + 1}. ${d.entry?.rider?.display_name || 'Unknown'} - ${d.entry?.horse?.display_name || 'No horse'}`).join('\n')}`;
    }).join('\n\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={{ padding: tokens.space.m }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.space.m }}>
        <h2 style={{ fontSize: tokens.typography.size.xl, fontWeight: tokens.typography.weight.bold }}>Draw Order</h2>
        <Button variant="secondary" onClick={handleCopy}>Copy</Button>
      </div>

      {draws.map((group: any) => (
        <div key={group.classId} style={{ marginBottom: tokens.space.m }}>
          <Card padding="m">
          <h3 style={{ fontSize: tokens.typography.size.l, fontWeight: tokens.typography.weight.semibold, marginBottom: tokens.space.s }}>
            {group.classTitle}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.s }}>
            {group.draws.map((draw: any, idx: number) => (
              <div key={draw.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: tokens.space.m,
                padding: tokens.space.s,
                borderBottom: idx < group.draws.length - 1 ? `1px solid ${tokens.color.text.secondary}20` : 'none',
              }}>
                <Badge variant="default">{draw.position}</Badge>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: tokens.typography.weight.medium }}>{draw.entry?.rider?.display_name || 'Unknown Rider'}</div>
                  {draw.entry?.horse && <div style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary }}>{draw.entry.horse.display_name}</div>}
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
