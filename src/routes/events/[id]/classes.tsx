/**
 * Event Classes Tab (Producer)
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getEventClasses, upsertClass, type EventClass } from '@/lib/rodeo/service';
import { Price } from '@/design/components/Price';

export default function EventClasses() {
  const { id: eventId } = useParams();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Partial<EventClass> | null>(null);

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['event-classes', eventId],
    queryFn: () => getEventClasses(eventId!),
    enabled: !!eventId
  });

  const upsertMutation = useMutation({
    mutationFn: (payload: Partial<EventClass>) => upsertClass(eventId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-classes', eventId] });
      setEditing(null);
      toast.success('Class saved');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const newClass = () => {
    setEditing({
      key: '',
      title: '',
      discipline: 'barrel',
      fees_jsonb: { entry_cents: 0, office_cents: 0, jackpot_cents: 0, exhibition_cents: 0 },
      added_money_cents: 0
    });
  };

  const save = () => {
    if (!editing?.key || !editing?.title) {
      toast.error('Key and title required');
      return;
    }
    upsertMutation.mutate(editing);
  };

  if (isLoading) return <div className="p-4">Loading classes...</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Event Classes</h2>
        <Button onClick={newClass}>Add Class</Button>
      </div>

      {classes.length === 0 && !editing && (
        <Card>
          <CardContent className="p-6 text-center opacity-70">
            No classes yet. Add your first class to get started.
          </CardContent>
        </Card>
      )}

      {classes.map((c) => (
        <Card key={c.id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{c.title}</span>
              <span className="text-sm opacity-70">{c.discipline}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>Entry: <Price cents={c.fees_jsonb.entry_cents} size="sm" /></div>
              <div>Office: <Price cents={c.fees_jsonb.office_cents} size="sm" /></div>
              <div>Jackpot: <Price cents={c.fees_jsonb.jackpot_cents} size="sm" /></div>
              <div>Added: <Price cents={c.added_money_cents} size="sm" /></div>
            </div>
            <div className="mt-2">
              <Button variant="secondary" size="sm" onClick={() => setEditing(c)}>Edit</Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {editing && (
        <Card>
          <CardHeader><CardTitle>{editing.id ? 'Edit' : 'New'} Class</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Key (e.g., open-4d)"
              value={editing.key || ''}
              onChange={(e) => setEditing({ ...editing, key: e.target.value })}
            />
            <Input
              placeholder="Title (e.g., Open 4D Barrels)"
              value={editing.title || ''}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
            <Select
              value={editing.discipline || 'barrel'}
              onValueChange={(val) => setEditing({ ...editing, discipline: val as any })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="barrel">Barrel Racing</SelectItem>
                <SelectItem value="team_roping">Team Roping</SelectItem>
                <SelectItem value="breakaway">Breakaway</SelectItem>
                <SelectItem value="tie_down">Tie-Down</SelectItem>
                <SelectItem value="steer_wrestling">Steer Wrestling</SelectItem>
                <SelectItem value="bull_riding">Bull Riding</SelectItem>
                <SelectItem value="bronc">Bronc</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Entry fee (cents)"
                value={editing.fees_jsonb?.entry_cents || 0}
                onChange={(e) => setEditing({
                  ...editing,
                  fees_jsonb: { ...editing.fees_jsonb!, entry_cents: Number(e.target.value) }
                })}
              />
              <Input
                type="number"
                placeholder="Office fee (cents)"
                value={editing.fees_jsonb?.office_cents || 0}
                onChange={(e) => setEditing({
                  ...editing,
                  fees_jsonb: { ...editing.fees_jsonb!, office_cents: Number(e.target.value) }
                })}
              />
              <Input
                type="number"
                placeholder="Jackpot fee (cents)"
                value={editing.fees_jsonb?.jackpot_cents || 0}
                onChange={(e) => setEditing({
                  ...editing,
                  fees_jsonb: { ...editing.fees_jsonb!, jackpot_cents: Number(e.target.value) }
                })}
              />
              <Input
                type="number"
                placeholder="Added money (cents)"
                value={editing.added_money_cents || 0}
                onChange={(e) => setEditing({ ...editing, added_money_cents: Number(e.target.value) })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
