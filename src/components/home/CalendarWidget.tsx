/**
 * Calendar Widget
 * Public calendar preview in Feed pane right rail
 */

import { Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function CalendarWidget() {
  const today = new Date();
  const upcomingEvents = [
    { date: 'Today', title: 'Team Meeting', time: '2:00 PM' },
    { date: 'Tomorrow', title: 'Project Demo', time: '10:00 AM' },
    { date: 'Friday', title: 'Client Call', time: '3:30 PM' },
  ];

  return (
    <Card className="border-border/40 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Upcoming
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {upcomingEvents.map((event, i) => (
          <div
            key={i}
            className="flex items-start gap-2 p-2 rounded hover:bg-accent/50 cursor-pointer transition-colors"
          >
            <div className="text-xs text-muted-foreground w-16 shrink-0 pt-0.5">
              {event.date}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{event.title}</p>
              <p className="text-xs text-muted-foreground">{event.time}</p>
            </div>
          </div>
        ))}
        
        <button className="w-full text-xs text-primary hover:underline mt-2">
          View all events →
        </button>
      </CardContent>
    </Card>
  );
}
