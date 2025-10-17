/**
 * Entrant "My" Tabs: My Entries, My Draws, My Results
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tabs } from '@/design/components/Tabs';
import { Card } from '@/design/components/Card';
import { Badge } from '@/design/components/Badge';
import { Price } from '@/design/components/Price';
import { Button } from '@/design/components/Button';
import { getEventClasses, getClassEntries, getClassDraw, getClassResults } from '@/lib/rodeo/service';
import { useSession } from '@/lib/auth/context';
import { EnterNowSheet } from '@/components/rodeo/EnterNowSheet';
import { tokens } from '@/design/tokens';

export default function EventEnter() {
  const { id: eventId } = useParams();
  const { session } = useSession();
  const [activeTab, setActiveTab] = useState('entries');
  const [showEnterSheet, setShowEnterSheet] = useState(false);

  const { data: classes = [] } = useQuery({
    queryKey: ['event-classes', eventId],
    queryFn: () => getEventClasses(eventId!),
    enabled: !!eventId,
  });

  const { data: myEntries = [] } = useQuery({
    queryKey: ['my-entries', eventId, session?.userId],
    queryFn: async () => {
      const results = await Promise.all(
        classes.map(async (c: any) => {
          const entries = await getClassEntries(c.id);
          return entries.filter((e: any) => e.rider_user_id === session?.userId);
        })
      );
      return results.flat();
    },
    enabled: !!eventId && !!session?.userId && classes.length > 0,
  });

  const { data: myDraws = [] } = useQuery({
    queryKey: ['my-draws', eventId, session?.userId],
    queryFn: async () => {
      const results = await Promise.all(
        classes.map(async (c: any) => {
          const draws = await getClassDraw(c.id);
          return draws.filter((d: any) => d.entry?.rider_user_id === session?.userId);
        })
      );
      return results.flat();
    },
    enabled: !!eventId && !!session?.userId && classes.length > 0,
  });

  const { data: myResults = [] } = useQuery({
    queryKey: ['my-results', eventId, session?.userId],
    queryFn: async () => {
      const results = await Promise.all(
        classes.map(async (c: any) => {
          const res = await getClassResults(c.id);
          return res.filter((r: any) => r.entry?.rider_user_id === session?.userId);
        })
      );
      return results.flat();
    },
    enabled: !!eventId && !!session?.userId && classes.length > 0,
  });

  const tabs = [
    {
      id: 'entries',
      label: `My Entries (${myEntries.length})`,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.m }}>
          <Button variant="primary" onClick={() => setShowEnterSheet(true)}>
            + Enter Now
          </Button>
          {myEntries.map((entry: any) => (
            <Card key={entry.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: tokens.typography.weight.semibold }}>{entry.class_id}</div>
                  <div style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary }}>
                    {entry.horse?.display_name || 'No horse'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: tokens.space.s, alignItems: 'center' }}>
                  <Price cents={entry.fees_cents} />
                  <Badge variant={entry.status === 'accepted' ? 'success' : 'default'}>
                    {entry.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ),
    },
    {
      id: 'draws',
      label: `My Draws (${myDraws.length})`,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.m }}>
          {myDraws.map((draw: any) => (
            <Card key={draw.id}>
              <div>
                <Badge variant="default">Position {draw.position}</Badge>
                <div style={{ marginTop: tokens.space.s, fontSize: tokens.typography.size.m }}>
                  Round {draw.round}
                </div>
                <div style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary }}>
                  {draw.entry?.horse?.display_name || 'No horse'}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ),
    },
    {
      id: 'results',
      label: `My Results (${myResults.length})`,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.m }}>
          {myResults.map((result: any) => (
            <Card key={result.id}>
              <div>
                <Badge variant={result.place <= 3 ? 'success' : 'default'}>
                  Place {result.place || 'N/A'}
                </Badge>
                <div style={{ marginTop: tokens.space.s, fontSize: tokens.typography.size.m }}>
                  Time: {result.time_ms ? (result.time_ms / 1000).toFixed(2) + 's' : 'DNF'}
                </div>
                {result.penalties_ms > 0 && (
                  <div style={{ fontSize: tokens.typography.size.s, color: tokens.color.danger }}>
                    +{(result.penalties_ms / 1000).toFixed(2)}s penalties
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: tokens.space.m }}>
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      <EnterNowSheet
        isOpen={showEnterSheet}
        onClose={() => setShowEnterSheet(false)}
        eventId={eventId!}
        userId={session?.userId!}
      />
    </div>
  );
}
