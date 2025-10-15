import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, isSameDay, startOfDay } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  starts_at: string;
  ends_at?: string;
  calendar_id: string;
  calendar_name?: string;
  visibility: 'public' | 'private' | 'busy';
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export function CalendarView({ events, onDateSelect, onEventClick }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateSelect?.(date);
    }
  };

  const selectedDateEvents = events.filter(event =>
    isSameDay(new Date(event.starts_at), selectedDate)
  );

  const eventDates = events.map(e => startOfDay(new Date(e.starts_at)));

  return (
    <div className="grid gap-4 md:grid-cols-[300px_1fr]">
      <Card className="p-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          modifiers={{
            hasEvents: eventDates,
          }}
          modifiersStyles={{
            hasEvents: {
              fontWeight: 'bold',
              textDecoration: 'underline',
            },
          }}
          className="pointer-events-auto"
        />
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          <Badge variant="secondary">
            {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'event' : 'events'}
          </Badge>
        </div>

        <ScrollArea className="h-[400px]">
          {selectedDateEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mb-2 opacity-50" />
              <p>No events for this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateEvents
                .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
                .map(event => (
                  <Button
                    key={event.id}
                    variant="outline"
                    className="w-full justify-start h-auto p-4 text-left"
                    onClick={() => onEventClick?.(event)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Clock className="h-5 w-5 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{event.title}</div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <span>{format(new Date(event.starts_at), 'h:mm a')}</span>
                          {event.ends_at && (
                            <>
                              <span>→</span>
                              <span>{format(new Date(event.ends_at), 'h:mm a')}</span>
                            </>
                          )}
                        </div>
                        {event.calendar_name && (
                          <Badge variant="secondary" className="mt-2">
                            {event.calendar_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
}
