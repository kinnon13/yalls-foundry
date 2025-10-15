import { useEffect, useState } from 'react';
import { CalendarView } from '@/components/calendar/CalendarView';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      // Using any to bypass type check until Supabase types regenerate
      const { data, error } = await (supabase as any)
        .from('calendar_events')
        .select(`
          *,
          calendar:calendars(name, calendar_type)
        `)
        .order('starts_at', { ascending: true });

      if (error) throw error;

      setEvents(data?.map((e: any) => ({
        ...e,
        calendar_name: e.calendar?.name,
      })) || []);
    } catch (error) {
      console.error('Failed to load events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calendar events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Manage your events and schedules
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      <CalendarView
        events={events}
        onEventClick={(event) => {
          toast({
            title: event.title,
            description: event.description || 'No description',
          });
        }}
      />
    </div>
  );
}
