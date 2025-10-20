/**
 * Calendar Feature
 * 
 * View and manage your schedule
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/design/components/Button';
import { X, ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import type { FeatureProps } from '@/feature-kernel/types';
import { Badge } from '@/components/ui/badge';

interface CalendarFeatureProps extends FeatureProps {
  view?: 'public' | 'private';
  range?: string;
  featureId: string;
  updateProps: (updates: Partial<FeatureProps>) => void;
  close: () => void;
}

// Mock events
const mockEvents = [
  { id: '1', title: 'Team Meeting', time: '09:00 AM', type: 'meeting', day: 15 },
  { id: '2', title: 'Client Call', time: '02:00 PM', type: 'call', day: 15 },
  { id: '3', title: 'Project Deadline', time: 'All Day', type: 'deadline', day: 18 },
  { id: '4', title: 'Lunch with Sarah', time: '12:30 PM', type: 'personal', day: 20 },
  { id: '5', title: 'Conference', time: '10:00 AM', type: 'event', day: 22 },
];

export default function CalendarFeature({
  view = 'public',
  range = '30d',
  featureId,
  updateProps,
  close,
}: CalendarFeatureProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-500/10 text-blue-500';
      case 'call': return 'bg-green-500/10 text-green-500';
      case 'deadline': return 'bg-red-500/10 text-red-500';
      case 'personal': return 'bg-purple-500/10 text-purple-500';
      case 'event': return 'bg-orange-500/10 text-orange-500';
      default: return 'bg-muted';
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Calendar</CardTitle>
            <Badge variant="secondary">{mockEvents.length} events</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'public' ? 'secondary' : 'ghost'}
              size="s"
              onClick={() => updateProps({ view: 'public' })}
            >
              Public
            </Button>
            <Button
              variant={view === 'private' ? 'secondary' : 'ghost'}
              size="s"
              onClick={() => updateProps({ view: 'private' })}
            >
              Private
            </Button>
            <Button variant="ghost" size="s" onClick={close}>
              <X size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{monthName}</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="s" onClick={goToPreviousMonth}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="ghost" size="s" onClick={goToNextMonth}>
                <ChevronRight size={16} />
              </Button>
              <Button variant="primary" size="s">
                <Plus size={16} className="mr-1" />
                New Event
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border rounded-lg overflow-hidden">
            {/* Week days */}
            <div className="grid grid-cols-7 bg-muted/50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2 min-h-20 border-t border-l" />
              ))}

              {/* Days of month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = mockEvents.filter(e => e.day === day);
                const isToday = day === 15; // Mock today

                return (
                  <div
                    key={day}
                    className={`p-2 min-h-20 border-t border-l hover:bg-muted/50 transition-colors ${
                      isToday ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          {dayEvents.length}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded ${getEventTypeColor(event.type)}`}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-xs opacity-75">{event.time}</div>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Events */}
          <div>
            <h4 className="font-semibold mb-2">Upcoming Events</h4>
            <div className="space-y-2">
              {mockEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg border">
                  <CalendarIcon size={16} className="text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.time}</p>
                  </div>
                  <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
