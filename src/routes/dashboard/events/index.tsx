/**
 * Events Panel - Full Event Management & Producer Tools
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, QrCode, Download } from 'lucide-react';

type Event = {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  location: any;
  status: string;
};

export default function EventsPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', starts_at: '', location: '' });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('events')
        .select('*')
        .order('starts_at', { ascending: false });
      if (error) throw error;
      return data as Event[];
    },
  });

  const createEvent = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('events')
        .insert({
          title: form.title,
          description: form.description,
          starts_at: form.starts_at,
          ends_at: form.starts_at,
          location: { name: form.location },
          organizer_id: user.user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false);
      setForm({ title: '', description: '', starts_at: '', location: '' });
      qc.invalidateQueries({ queryKey: ['events'] });
      toast({ title: 'Event created!' });
    },
    onError: (e) => toast({ title: 'Failed', description: String(e), variant: 'destructive' }),
  });

  const upcoming = events.filter(e => new Date(e.starts_at) > new Date());
  const past = events.filter(e => new Date(e.starts_at) <= new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Events Management</h1>
          <p className="text-muted-foreground">Organize shows, competitions, and producer tools</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Create Event</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder="Event Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
              <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <Button className="w-full" disabled={!form.title || createEvent.isPending} onClick={() => createEvent.mutate()}>
                {createEvent.isPending ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6">
          <Calendar className="w-8 h-8 text-primary mb-2" />
          <div className="text-2xl font-bold">{upcoming.length}</div>
          <div className="text-sm text-muted-foreground">Upcoming Events</div>
        </Card>
        <Card className="p-6">
          <QrCode className="w-8 h-8 text-primary mb-2" />
          <div className="text-2xl font-bold">QR Check-in</div>
          <Button variant="outline" size="sm" className="mt-2 w-full">Enable</Button>
        </Card>
        <Card className="p-6">
          <Download className="w-8 h-8 text-primary mb-2" />
          <div className="text-2xl font-bold">Export CSV</div>
          <Button variant="outline" size="sm" className="mt-2 w-full">Download</Button>
        </Card>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcoming.map(event => (
            <Card key={event.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                  <div className="flex gap-2 text-sm">
                    <Badge variant="outline">{new Date(event.starts_at).toLocaleDateString()}</Badge>
                    <Badge variant="outline">{event.location?.name}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm">Entries</Button>
                </div>
              </div>
            </Card>
          ))}
          {upcoming.length === 0 && <p className="text-center text-muted-foreground py-8">No upcoming events</p>}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {past.map(event => (
            <Card key={event.id} className="p-6 opacity-70">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-1">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">{new Date(event.starts_at).toLocaleDateString()}</p>
                </div>
                <Button variant="outline" size="sm">Results</Button>
              </div>
            </Card>
          ))}
          {past.length === 0 && <p className="text-center text-muted-foreground py-8">No past events</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
