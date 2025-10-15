import { useEffect, useState } from 'react';
import { CalendarView } from '@/components/calendar/CalendarView';
import { CalendarPrivacySettings } from '@/components/settings/CalendarPrivacySettings';
import { CalendarSidebar } from '@/components/calendar/CalendarSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Button } from '@/components/ui/button';
import CreateEventDialog from '@/components/calendar/CreateEventDialog';

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [selectedCalendarIds, selectedCollectionIds]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Load events from selected individual calendars
      let allEvents: any[] = [];
      
      if (selectedCalendarIds.length > 0) {
        const { data: calEvents, error: calError } = await (supabase as any)
          .from('calendar_events')
          .select(`
            *,
            calendar:calendars(name, calendar_type, color)
          `)
          .in('calendar_id', selectedCalendarIds)
          .order('starts_at', { ascending: true });

        if (calError) throw calError;
        allEvents = [...allEvents, ...(calEvents || [])];
      }

      // Load events from selected collections
      for (const collectionId of selectedCollectionIds) {
        const { data, error } = await supabase.functions.invoke('calendar-ops', {
          body: {
            operation: 'get_collection_events',
            collection_id: collectionId,
          },
        });

        if (error) throw error;
        if (data?.events) {
          allEvents = [...allEvents, ...data.events];
        }
      }

      // Deduplicate events by id
      const uniqueEvents = Array.from(
        new Map(allEvents.map((e) => [e.id, e])).values()
      );

      setEvents(uniqueEvents.map((e: any) => ({
        ...e,
        calendar_name: e.calendar?.name,
        calendar_color: e.calendar?.color,
      })));
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

  const handleCalendarToggle = (id: string) => {
    setSelectedCalendarIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const handleCollectionToggle = (id: string) => {
    setSelectedCollectionIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading calendar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GlobalHeader />
      <div className="flex flex-1 overflow-hidden">
        <CalendarSidebar
          selectedCalendarIds={selectedCalendarIds}
          selectedCollectionIds={selectedCollectionIds}
          onCalendarToggle={handleCalendarToggle}
          onCollectionToggle={handleCollectionToggle}
          onRefresh={loadEvents}
        />
        
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Calendar</h1>
                <p className="text-muted-foreground mt-1">
                  {selectedCalendarIds.length + selectedCollectionIds.length === 0
                    ? 'Select calendars or collections to view events'
                    : `Viewing ${selectedCalendarIds.length} calendar(s) and ${selectedCollectionIds.length} collection(s)`}
                </p>
              </div>
              <Button onClick={() => setCreateOpen(true)}>New Event</Button>
            </div>

            <CreateEventDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={loadEvents} />
            <Tabs defaultValue="calendar" className="space-y-4">
              <TabsList>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="privacy">
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Privacy Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calendar">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading events...</p>
                  </div>
                ) : (
                  <CalendarView
                    events={events}
                    onEventClick={(event) => {
                      toast({
                        title: event.title,
                        description: event.description || 'No description',
                      });
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent value="privacy">
                <CalendarPrivacySettings />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
