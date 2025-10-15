/**
 * Event Detail Page (stub)
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getEventById } from '@/lib/events/service.supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventById(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="container mx-auto px-4 py-8"><Skeleton className="h-64" /></div>;
  if (!event) return <div className="container mx-auto px-4 py-8">Event not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Type: {event.type}</p>
          <p>Starts: {new Date(event.starts_at).toLocaleDateString()}</p>
        </CardContent>
      </Card>
    </div>
  );
}
