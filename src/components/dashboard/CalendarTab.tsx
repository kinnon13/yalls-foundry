/**
 * Dashboard Calendar Tab
 * Personal calendar view with event management
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { CalendarView } from '@/components/calendar/CalendarView';
import { CalendarSidebar } from '@/components/calendar/CalendarSidebar';
import { Card } from '@/components/ui/card';

export function CalendarTab() {
  const { session } = useSession();
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);

  const { data: events, refetch } = useQuery({
    queryKey: ['calendar-events', session?.userId, selectedCalendarIds],
    queryFn: async () => {
      const { data } = await supabase
        .from('calendar_events')
        .select('*')
        .in('calendar_id', selectedCalendarIds.length > 0 ? selectedCalendarIds : ['00000000-0000-0000-0000-000000000000'])
        .order('starts_at', { ascending: true });
      
      return data || [];
    },
    enabled: !!session?.userId && selectedCalendarIds.length > 0,
  });

  return (
    <Card className="p-6">
      <div className="flex gap-6 h-[calc(100vh-200px)]">
        <CalendarSidebar 
          selectedCalendarIds={selectedCalendarIds}
          selectedCollectionIds={selectedCollectionIds}
          onCalendarToggle={(id) => {
            setSelectedCalendarIds(prev => 
              prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
          }}
          onCollectionToggle={(id) => {
            setSelectedCollectionIds(prev => 
              prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
          }}
          onRefresh={refetch}
        />
        <div className="flex-1">
          <CalendarView events={events || []} />
        </div>
      </div>
    </Card>
  );
}