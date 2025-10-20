/**
 * Calendar Integration Panel - Super Admin Only
 * Gives Rocker access to calendar data
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CalendarEvent {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
}

export function CalendarIntegrationPanel() {
  const { toast } = useToast();
  const [calendarEnabled, setCalendarEnabled] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendarSettings();
    loadUpcomingEvents();
  }, []);

  const loadCalendarSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('super_admin_settings')
        .select('allow_calendar_access')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setCalendarEnabled(data?.allow_calendar_access || false);
    } catch (error) {
      console.error('Failed to load calendar settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, starts_at, ends_at')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(5);

      if (error) throw error;
      setUpcomingEvents(data || []);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const toggleCalendarAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newValue = !calendarEnabled;

      const { error } = await supabase
        .from('super_admin_settings')
        .upsert({
          user_id: user.id,
          allow_calendar_access: newValue
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setCalendarEnabled(newValue);
      toast({
        title: 'Updated',
        description: `Calendar access ${newValue ? 'enabled' : 'disabled'} for Rocker`
      });
    } catch (error) {
      console.error('Failed to toggle calendar:', error);
      toast({
        title: 'Error',
        description: 'Failed to update calendar settings',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar Integration
        </CardTitle>
        <CardDescription>
          Allow Rocker to read your calendar and proactively suggest prep, reminders, and follow-ups
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="calendar-access" className="font-medium">
              Enable Calendar Access
            </Label>
            <p className="text-xs text-muted-foreground">
              Rocker can view upcoming events and suggest actions
            </p>
          </div>
          <Switch
            id="calendar-access"
            checked={calendarEnabled}
            onCheckedChange={toggleCalendarAccess}
          />
        </div>

        {calendarEnabled && upcomingEvents.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Upcoming Events Rocker Can See</Label>
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{event.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.starts_at).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="secondary">Visible</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {calendarEnabled && upcomingEvents.length === 0 && (
          <p className="text-sm text-muted-foreground">No upcoming events</p>
        )}
      </CardContent>
    </Card>
  );
}
