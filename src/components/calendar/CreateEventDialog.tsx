import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CalendarOption {
  id: string;
  name: string;
}

export default function CreateEventDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [calendarId, setCalendarId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [startsAt, setStartsAt] = useState<string>('');
  const [endsAt, setEndsAt] = useState<string>('');
  const [meetingLink, setMeetingLink] = useState('');
  const [voiceReminder, setVoiceReminder] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState<number>(10);

  useEffect(() => {
    if (open) {
      void loadCalendars();
      // default times: now rounded to next hour
      const now = new Date();
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1);
      const end = new Date(now);
      end.setHours(end.getHours() + 1);
      setStartsAt(now.toISOString().slice(0, 16)); // yyyy-MM-ddTHH:mm
      setEndsAt(end.toISOString().slice(0, 16));
    }
  }, [open]);

  const loadCalendars = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('calendars')
        .select('id, name')
        .order('name', { ascending: true });
      if (error) throw error;
      setCalendars(data || []);
      if ((data || []).length > 0) setCalendarId((data as CalendarOption[])[0].id);
    } catch (err) {
      console.error('Failed to load calendars', err);
      toast({ title: 'Error', description: 'Could not load calendars', variant: 'destructive' });
    }
  };

  const handleCreateDefaultCalendar = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('calendar-ops', {
        body: {
          operation: 'create_calendar',
          name: 'My Calendar',
          calendar_type: 'personal',
        },
      });
      if (error) throw error;
      toast({ title: 'Calendar created', description: 'Personal calendar ready' });
      await loadCalendars();
    } catch (err: any) {
      console.error('Create calendar failed', err);
      toast({ title: 'Error', description: err?.message || 'Failed to create calendar', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setAllDay(false);
  };

  const handleCreateEvent = async () => {
    if (!calendarId) {
      toast({ title: 'Select a calendar', description: 'Please select a calendar to save the event.' });
      return;
    }
    if (!title.trim()) {
      toast({ title: 'Title required', description: 'Please enter an event title.' });
      return;
    }
    if (!startsAt || !endsAt) {
      toast({ title: 'Dates required', description: 'Please choose start and end time.' });
      return;
    }

    try {
      setLoading(true);
      const meta: any = {};
      if (meetingLink.trim()) meta.zoom_url = meetingLink.trim();
      const payload: any = {
        operation: 'create_event',
        calendar_id: calendarId,
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        all_day: allDay,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        metadata: Object.keys(meta).length ? meta : undefined,
      };
      const { data, error } = await supabase.functions.invoke('calendar-ops', { body: payload });
      if (error) throw error;

      toast({ title: 'Event created', description: 'Your event was added to the calendar.' });
      onOpenChange(false);
      resetForm();
      onCreated?.();
    } catch (err: any) {
      console.error('Create event failed', err);
      toast({ title: 'Error', description: err?.message || 'Failed to create event', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!loading) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {calendars.length === 0 ? (
            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground mb-3">You don’t have any calendars yet.</p>
              <Button size="sm" onClick={handleCreateDefaultCalendar} disabled={loading}>
                Create Personal Calendar
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <div className="grid gap-2">
                <Label>Calendar</Label>
                <Select value={calendarId} onValueChange={setCalendarId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select calendar" />
                  </SelectTrigger>
                  <SelectContent>
                    {calendars.map((cal) => (
                      <SelectItem key={cal.id} value={cal.id}>{cal.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
              </div>

              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details" />
              </div>

              <div className="grid gap-2">
                <Label>Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional location" />
              </div>

              <div className="grid gap-2">
                <Label>Meeting link</Label>
                <Input type="url" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://zoom.us/j/..." />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Starts</Label>
                  <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Ends</Label>
                  <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center justify-between border rounded-md px-3 py-2">
                <div>
                  <Label className="text-sm">All day</Label>
                  <p className="text-xs text-muted-foreground">Treat as an all-day event</p>
                </div>
                <Switch checked={allDay} onCheckedChange={setAllDay} />
              </div>

              <div className="flex items-center justify-between border rounded-md px-3 py-2">
                <div>
                  <Label className="text-sm">Voice reminder</Label>
                  <p className="text-xs text-muted-foreground">Rocker will speak a reminder before the event</p>
                </div>
                <div className="flex items-center gap-3">
                  <Input type="number" min={1} max={1440} className="w-24" value={reminderMinutes} onChange={(e) => setReminderMinutes(Number(e.target.value) || 0)} />
                  <span className="text-sm text-muted-foreground">min before</span>
                  <Switch checked={voiceReminder} onCheckedChange={setVoiceReminder} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleCreateEvent} disabled={loading || calendars.length === 0}>Create Event</Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
